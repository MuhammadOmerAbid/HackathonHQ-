from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Post, Event, Team, Submission, JudgeFeedback,
    UserProfile, Activity, Follow, Tag, PostLike, PostRepost,
    Conversation, ConversationParticipant, Message
)

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'is_organizer', 'is_judge', 'organization_name', 'location',
            'bio', 'avatar', 'cover_image',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url',
            'last_active', 'suspended_until', 'banned_until', 'ban_reason',
            'created_at'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    is_organizer = serializers.SerializerMethodField()
    is_judge = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    github_url = serializers.SerializerMethodField()
    linkedin_url = serializers.SerializerMethodField()
    twitter_url = serializers.SerializerMethodField()
    website_url = serializers.SerializerMethodField()
    last_active = serializers.SerializerMethodField()
    suspended_until = serializers.SerializerMethodField()
    banned_until = serializers.SerializerMethodField()
    ban_reason = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name",
                  "is_active", "is_staff", "is_superuser",
                  "profile",
                  "posts_count", "followers_count", "following_count", "is_following",
                  "is_organizer", "is_judge", "organization_name", "bio", "location",
                  "avatar", "cover_image",
                  "github_url", "linkedin_url", "twitter_url", "website_url",
                  "last_active", "suspended_until", "banned_until", "ban_reason",
                  "date_joined"]

    def get_is_organizer(self, obj):
        try:
            return bool(getattr(obj.profile, 'is_organizer', False)) or obj.is_staff or obj.is_superuser
        except:
            return obj.is_staff or obj.is_superuser

    def get_is_judge(self, obj):
        try:
            return bool(getattr(obj.profile, 'is_judge', False))
        except:
            return False

    def get_posts_count(self, obj):
        try:
            return obj.posts.count()
        except:
            return 0

    def get_followers_count(self, obj):
        try:
            return obj.followers_set.count()
        except:
            return 0

    def get_following_count(self, obj):
        try:
            return obj.following_set.count()
        except:
            return 0

    def get_is_following(self, obj):
        """Check if the current user is following this user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            try:
                from .models import Follow
                return Follow.objects.filter(
                    follower=request.user,
                    followed=obj
                ).exists()
            except:
                return False
        return False

    def get_organization_name(self, obj):
        try:
            return getattr(obj.profile, 'organization_name', None)
        except:
            return None

    def get_bio(self, obj):
        try:
            return getattr(obj.profile, 'bio', None)
        except:
            return None

    def get_location(self, obj):
        try:
            return getattr(obj.profile, 'location', None)
        except:
            return None

    def get_avatar(self, obj):
        try:
            avatar = getattr(obj.profile, 'avatar', None)
            if not avatar:
                return None
            request = self.context.get('request')
            return request.build_absolute_uri(avatar.url) if request else avatar.url
        except:
            return None

    def get_cover_image(self, obj):
        try:
            cover = getattr(obj.profile, 'cover_image', None)
            if not cover:
                return None
            request = self.context.get('request')
            return request.build_absolute_uri(cover.url) if request else cover.url
        except:
            return None

    def get_github_url(self, obj):
        try:
            return getattr(obj.profile, 'github_url', None)
        except:
            return None

    def get_linkedin_url(self, obj):
        try:
            return getattr(obj.profile, 'linkedin_url', None)
        except:
            return None

    def get_twitter_url(self, obj):
        try:
            return getattr(obj.profile, 'twitter_url', None)
        except:
            return None

    def get_website_url(self, obj):
        try:
            return getattr(obj.profile, 'website_url', None)
        except:
            return None

    def get_last_active(self, obj):
        try:
            return getattr(obj.profile, 'last_active', None)
        except:
            return None

    def get_suspended_until(self, obj):
        try:
            return getattr(obj.profile, 'suspended_until', None)
        except:
            return None

    def get_banned_until(self, obj):
        try:
            return getattr(obj.profile, 'banned_until', None)
        except:
            return None

    def get_ban_reason(self, obj):
        try:
            return getattr(obj.profile, 'ban_reason', None)
        except:
            return None

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(source='owner', read_only=True)
    tags = serializers.SerializerMethodField()
    tags_input = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True, write_only=True
    )
    event = serializers.SerializerMethodField()
    event_input = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), required=False, allow_null=True, write_only=True
    )
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(), required=False, allow_null=True
    )
    likes_count = serializers.SerializerMethodField()
    reposts_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    liked_by = serializers.SerializerMethodField()
    reposted_by = serializers.SerializerMethodField()
    repost_context = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'created_at',
            'post_type', 'is_pinned', 'pinned_at', 'scheduled_for', 'is_deleted',
            'author', 'parent', 'event',
            'tags', 'tags_input', 'event_input',
            'likes_count', 'reposts_count', 'comments_count',
            'liked_by', 'reposted_by', 'repost_context'
        ]

    def get_tags(self, obj):
        return [t.name for t in obj.tags.all()]

    def _get_tags_input(self, validated_data):
        tags = validated_data.pop('tags_input', None)
        if tags is None:
            tags = self.initial_data.get('tags')
        if tags is None:
            return None
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        return tags

    def _set_tags(self, instance, tags):
        if tags is None:
            return
        clean = []
        for t in tags:
            if not t:
                continue
            name = str(t).strip().lower()
            if name and name not in clean:
                clean.append(name)
        tag_objs = []
        for name in clean:
            tag_obj, _ = Tag.objects.get_or_create(name=name)
            tag_objs.append(tag_obj)
        instance.tags.set(tag_objs)

    def get_event(self, obj):
        if not obj.event:
            return None
        return {
            'id': obj.event.id,
            'name': obj.event.name,
            'start_date': obj.event.start_date,
            'end_date': obj.event.end_date
        }

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_reposts_count(self, obj):
        return obj.reposts.count()

    def get_comments_count(self, obj):
        return obj.replies.filter(is_deleted=False).count()

    def get_liked_by(self, obj):
        return list(obj.likes.values_list('user_id', flat=True))

    def get_reposted_by(self, obj):
        return list(obj.reposts.values_list('user_id', flat=True))

    def get_repost_context(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        try:
            scope = request.query_params.get('feed') or request.query_params.get('following')
            if not (scope == 'following' or (scope and str(scope).lower() in ['1', 'true', 'yes'])):
                return None
            following_ids = self.context.get('following_ids')
            if following_ids is None:
                from .models import Follow
                following_ids = list(Follow.objects.filter(follower=request.user)\
                    .values_list('followed_id', flat=True))
                self.context['following_ids'] = following_ids
            if not following_ids:
                return None
            repost = obj.reposts.filter(user_id__in=following_ids)\
                .select_related('user', 'user__profile')\
                .order_by('-created_at')\
                .first()
            if not repost:
                return None
            user = repost.user
            avatar = None
            try:
                avatar_obj = getattr(user.profile, 'avatar', None)
                if avatar_obj:
                    avatar = request.build_absolute_uri(avatar_obj.url) if request else avatar_obj.url
            except:
                avatar = None
            return {
                'id': user.id,
                'username': user.username,
                'avatar': avatar
            }
        except Exception:
            return None

    def create(self, validated_data):
        if 'event_input' in validated_data:
            validated_data['event'] = validated_data.pop('event_input')
        if 'event' not in validated_data:
            event_id = self.initial_data.get('event')
            if event_id:
                try:
                    validated_data['event'] = Event.objects.get(pk=event_id)
                except Event.DoesNotExist:
                    pass
        tags = self._get_tags_input(validated_data)
        if 'post_type' in validated_data and validated_data.get('post_type') is None:
            validated_data['post_type'] = Post.POST_TYPE_POST
        instance = super().create(validated_data)
        self._set_tags(instance, tags)
        return instance

    def update(self, instance, validated_data):
        if 'event_input' in validated_data:
            validated_data['event'] = validated_data.pop('event_input')
        if 'event' not in validated_data:
            event_id = self.initial_data.get('event')
            if event_id:
                try:
                    validated_data['event'] = Event.objects.get(pk=event_id)
                except Event.DoesNotExist:
                    pass
        tags = self._get_tags_input(validated_data)
        instance = super().update(instance, validated_data)
        self._set_tags(instance, tags)
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ["username", "email", "password"]
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )
        UserProfile.objects.create(user=user)
        return user

class EventSerializer(serializers.ModelSerializer):
    organizer_details = UserSerializer(source='organizer', read_only=True)
    organizer_username = serializers.ReadOnlyField(source='organizer.username')
    teams_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ['id', 'name', 'description', 'start_date', 'end_date',
                  'is_premium', 'organizer', 'organizer_username', 'organizer_details',
                  'teams_count']
        read_only_fields = ['organizer']
    
    def get_teams_count(self, obj):
        return obj.teams.count()

class TeamSerializer(serializers.ModelSerializer):
    members_details = UserSerializer(source='members', many=True, read_only=True)
    event_name = serializers.ReadOnlyField(source='event.name')
    leader_details = UserSerializer(source='leader', read_only=True)
    submissions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'max_members', 'event', 'event_name',
            'leader', 'leader_details', 'members', 'members_details',
            'created_at', 'submissions_count'
        ]
        read_only_fields = ['members', 'leader']
    
    def get_submissions_count(self, obj):
        return obj.submissions.count()

class SubmissionSerializer(serializers.ModelSerializer):
    # Team details
    team_details = TeamSerializer(source='team', read_only=True)
    team_name = serializers.ReadOnlyField(source='team.name')
    
    # Event via team
    event_name = serializers.ReadOnlyField(source='team.event.name')
    event = serializers.SerializerMethodField()
    
    # Submitted by
    submitted_by_username = serializers.ReadOnlyField(source='submitted_by.username')
    submitted_by_details = UserSerializer(source='submitted_by', read_only=True)
    
    # Feedback stats
    feedback_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id',
            'team', 'team_details', 'team_name',
            'event', 'event_name',
            'submitted_by', 'submitted_by_username', 'submitted_by_details',
            'title', 'description',
            'file', 'created_at', 'score',
            'is_reviewed', 'is_winner',
            'winner_place', 'winner_prize',
            'feedback_count', 'average_score',
        ]
        read_only_fields = ['score', 'submitted_by', 'is_reviewed']

    def get_event(self, obj):
        event = obj.team.event if obj.team else None
        if not event:
            return None
        return {
            'id': event.id,
            'name': event.name,
            'start_date': event.start_date,
            'end_date': event.end_date,
        }
    
    def get_feedback_count(self, obj):
        return obj.feedback.count()
    
    def get_average_score(self, obj):
        if obj.feedback.exists():
            return sum(f.score for f in obj.feedback.all()) / obj.feedback.count()
        return None

class JudgeFeedbackSerializer(serializers.ModelSerializer):
    judge_details = UserSerializer(source='judge', read_only=True)
    judge_username = serializers.ReadOnlyField(source='judge.username')
    submission_title = serializers.ReadOnlyField(source='submission.title')
    
    class Meta:
        model = JudgeFeedback
        fields = ['id', 'submission', 'submission_title', 'judge', 'judge_details',
                  'judge_username', 'score', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['judge']

# ========== ACTIVITY SERIALIZER ==========
class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'type', 'title', 'description', 'metadata', 
                  'is_important', 'created_at', 'team', 'submission', 'event']

# ========== USER DIRECTORY SERIALIZER (FIXED - SINGLE VERSION) ==========
class UserDirectorySerializer(serializers.ModelSerializer):
    """Serializer for the users directory page with all needed fields"""
    profile = UserProfileSerializer(read_only=True)
    posts_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_organizer = serializers.SerializerMethodField()
    is_judge = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    github_url = serializers.SerializerMethodField()
    linkedin_url = serializers.SerializerMethodField()
    twitter_url = serializers.SerializerMethodField()
    website_url = serializers.SerializerMethodField()
    last_active = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser',
            'profile',
            'posts_count', 'followers_count', 'following_count',
            'is_following',
            'is_organizer', 'is_judge', 'organization_name',
            'bio', 'location', 'avatar', 'cover_image',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url',
            'last_active',
            'date_joined'
        ]
    
    def get_posts_count(self, obj):
        try:
            return obj.posts.count()
        except:
            return 0
    
    def get_followers_count(self, obj):
        try:
            return obj.followers_set.count()
        except:
            return 0
    
    def get_following_count(self, obj):
        try:
            return obj.following_set.count()
        except:
            return 0
    
    def get_is_following(self, obj):
        """Check if the current user is following this user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            try:
                from .models import Follow
                return Follow.objects.filter(
                    follower=request.user,
                    followed=obj
                ).exists()
            except:
                return False
        return False

    def get_is_organizer(self, obj):
        try:
            return bool(getattr(obj.profile, 'is_organizer', False)) or obj.is_staff or obj.is_superuser
        except:
            return obj.is_staff or obj.is_superuser

    def get_is_judge(self, obj):
        try:
            return bool(getattr(obj.profile, 'is_judge', False))
        except:
            return False

    def get_organization_name(self, obj):
        try:
            return getattr(obj.profile, 'organization_name', None)
        except:
            return None

    def get_bio(self, obj):
        try:
            return getattr(obj.profile, 'bio', None)
        except:
            return None

    def get_location(self, obj):
        try:
            return getattr(obj.profile, 'location', None)
        except:
            return None

    def get_avatar(self, obj):
        try:
            avatar = getattr(obj.profile, 'avatar', None)
            if not avatar:
                return None
            request = self.context.get('request')
            return request.build_absolute_uri(avatar.url) if request else avatar.url
        except:
            return None

    def get_cover_image(self, obj):
        try:
            cover = getattr(obj.profile, 'cover_image', None)
            if not cover:
                return None
            request = self.context.get('request')
            return request.build_absolute_uri(cover.url) if request else cover.url
        except:
            return None

    def get_github_url(self, obj):
        try:
            return getattr(obj.profile, 'github_url', None)
        except:
            return None

    def get_linkedin_url(self, obj):
        try:
            return getattr(obj.profile, 'linkedin_url', None)
        except:
            return None

    def get_twitter_url(self, obj):
        try:
            return getattr(obj.profile, 'twitter_url', None)
        except:
            return None

    def get_website_url(self, obj):
        try:
            return getattr(obj.profile, 'website_url', None)
        except:
            return None

    def get_last_active(self, obj):
        try:
            return getattr(obj.profile, 'last_active', None)
        except:
            return None


class TeamSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    team = TeamSummarySerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'is_team', 'team', 'participants', 'other_user', 'last_message', 'unread_count', 'updated_at']

    def get_other_user(self, obj):
        if obj.is_team:
            return None
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        for p in obj.participants.all():
            if p.id != request.user.id:
                return UserSerializer(p, context=self.context).data
        return None

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return MessageSerializer(last, context=self.context).data if last else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        try:
            link = ConversationParticipant.objects.get(conversation=obj, user=request.user)
        except ConversationParticipant.DoesNotExist:
            return 0
        qs = obj.messages.exclude(sender=request.user)
        if link.last_read_at:
            qs = qs.filter(created_at__gt=link.last_read_at)
        return qs.count()

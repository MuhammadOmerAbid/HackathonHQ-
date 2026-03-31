from rest_framework import serializers
from django.db import IntegrityError
from django.db.models import Count
from django.contrib.auth import get_user_model
from .models import (
    Post, Event, Team, TeamEvent, Submission, JudgeFeedback,
    EventResource, EventSponsor, AwardCategory, AwardResult,
    JudgeAssignment, Notification, Announcement, MediaAsset,
    UserProfile, Activity, Follow, Tag, PostLike, PostRepost, UserReport,
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
    winners = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'created_at',
            'post_type', 'is_pinned', 'pinned_at', 'scheduled_for', 'is_deleted',
            'author', 'parent', 'event',
            'tags', 'tags_input', 'event_input',
            'likes_count', 'reposts_count', 'comments_count',
            'liked_by', 'reposted_by', 'repost_context',
            'winners'
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

    def get_winners(self, obj):
        try:
            if not obj or obj.post_type != Post.POST_TYPE_RESULT:
                return []
            event = obj.event
            if not event:
                return []
            winners = Submission.objects.filter(
                team_event__event=event,
                is_winner=True
            ).select_related('team_event', 'team_event__team')

            order_map = {
                '1st': 1,
                '2nd': 2,
                '3rd': 3,
                'honorable_mention': 4
            }

            winner_list = []
            for sub in winners:
                winner_list.append({
                    'id': sub.id,
                    'title': sub.title,
                    'team_name': sub.team_event.team.name if sub.team_event and sub.team_event.team else None,
                    'winner_place': sub.winner_place,
                    'winner_prize': sub.winner_prize,
                    'score': sub.score
                })

            winner_list.sort(key=lambda w: (order_map.get(w.get('winner_place') or '', 99), -(w.get('score') or 0)))
            for w in winner_list:
                w.pop('score', None)
            return winner_list
        except Exception:
            return []

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

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        # Allow duplicate emails; username remains the unique login identifier.
        return value

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long.")
        return value
    
    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                username=validated_data["username"],
                email=validated_data.get("email", ""),
                password=validated_data["password"]
            )
            return user
        except IntegrityError:
            raise serializers.ValidationError("User with these credentials already exists.")
        except Exception:
            raise serializers.ValidationError("Registration failed. Please try again.")

class EventSerializer(serializers.ModelSerializer):
    organizer_details = UserSerializer(source='organizer', read_only=True)
    organizer_username = serializers.ReadOnlyField(source='organizer.username')
    teams_count = serializers.SerializerMethodField()
    judges_count = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()
    submissions_count = serializers.SerializerMethodField()
    judges_details = UserSerializer(source='judges', many=True, read_only=True)
    status = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()
    sponsors = serializers.SerializerMethodField()
    award_categories = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ['id', 'name', 'description', 'start_date', 'end_date',
                  'is_premium', 'judging_criteria',
                  'status', 'status_override',
                  'registration_deadline', 'team_deadline', 'submission_open_at',
                  'submission_deadline', 'judging_start', 'judging_end',
                  'reviewers_per_submission',
                  'max_participants',
                  'organizer', 'organizer_username', 'organizer_details',
                  'teams_count', 'judges_count', 'participants_count', 'submissions_count',
                  'judges_details',
                  'resources', 'sponsors', 'award_categories']
        read_only_fields = ['organizer']
    
    def get_teams_count(self, obj):
        try:
            return TeamEvent.objects.filter(event=obj, status=TeamEvent.STATUS_ENROLLED).count()
        except Exception:
            return 0

    def get_judges_count(self, obj):
        try:
            return obj.judges.count()
        except Exception:
            return 0

    def get_participants_count(self, obj):
        try:
            team_ids = TeamEvent.objects.filter(
                event=obj,
                status=TeamEvent.STATUS_ENROLLED
            ).values_list("team_id", flat=True)
            data = Team.objects.filter(id__in=team_ids).aggregate(cnt=Count('members', distinct=True))
            return data.get('cnt') or 0
        except Exception:
            return 0

    def get_submissions_count(self, obj):
        try:
            return Submission.objects.filter(team_event__event=obj).count()
        except Exception:
            return 0

    def get_status(self, obj):
        try:
            return obj.get_status()
        except Exception:
            return obj.status

    def get_resources(self, obj):
        from .models import EventResource
        qs = EventResource.objects.filter(event=obj).order_by('created_at')
        return EventResourceSerializer(qs, many=True).data

    def get_sponsors(self, obj):
        from .models import EventSponsor
        qs = EventSponsor.objects.filter(event=obj).order_by('created_at')
        return EventSponsorSerializer(qs, many=True).data

    def get_award_categories(self, obj):
        from .models import AwardCategory
        qs = AwardCategory.objects.filter(event=obj).order_by('created_at')
        return AwardCategorySerializer(qs, many=True).data

class EventResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventResource
        fields = ['id', 'event', 'title', 'description', 'url', 'created_at']

class EventSponsorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventSponsor
        fields = ['id', 'event', 'name', 'tier', 'logo_url', 'website', 'challenge_desc', 'created_at']

class AwardCategorySerializer(serializers.ModelSerializer):
    sponsor_details = EventSponsorSerializer(source='sponsor', read_only=True)

    class Meta:
        model = AwardCategory
        fields = ['id', 'event', 'title', 'description', 'sponsor', 'sponsor_details', 'created_at']

class AwardResultSerializer(serializers.ModelSerializer):
    submission_title = serializers.ReadOnlyField(source='submission.title')
    category_title = serializers.ReadOnlyField(source='category.title')

    class Meta:
        model = AwardResult
        fields = ['id', 'event', 'submission', 'submission_title', 'category', 'category_title', 'place', 'score', 'created_at']

class JudgeAssignmentSerializer(serializers.ModelSerializer):
    judge_details = UserSerializer(source='judge', read_only=True)
    submission_title = serializers.ReadOnlyField(source='submission.title')

    class Meta:
        model = JudgeAssignment
        fields = ['id', 'event', 'submission', 'submission_title', 'judge', 'judge_details', 'assigned_at', 'is_active', 'override_reason']

class MediaAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaAsset
        fields = ['id', 'submission', 'type', 'url', 'metadata', 'created_at']

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'event', 'title', 'body', 'pinned', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'body', 'link', 'is_read', 'created_at']

class TeamEventSerializer(serializers.ModelSerializer):
    event_name = serializers.ReadOnlyField(source='event.name')
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = TeamEvent
        fields = [
            'id', 'team', 'team_name', 'event', 'event_name',
            'status', 'enrolled_at', 'withdrawn_at', 'disqualified_at',
            'status_changed_by', 'status_reason'
        ]

class TeamSerializer(serializers.ModelSerializer):
    members_details = UserSerializer(source='members', many=True, read_only=True)
    leader_details = UserSerializer(source='leader', read_only=True)
    submissions_count = serializers.SerializerMethodField()
    enrollments = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'max_members', 'event_name',
            'leader', 'leader_details', 'members', 'members_details',
            'created_at', 'submissions_count', 'enrollments'
        ]
        read_only_fields = ['members', 'leader']
    
    def get_submissions_count(self, obj):
        try:
            return Submission.objects.filter(team_event__team=obj).count()
        except Exception:
            return 0

    def get_enrollments(self, obj):
        try:
            qs = TeamEvent.objects.filter(team=obj).order_by('-enrolled_at')
            return TeamEventSerializer(qs, many=True).data
        except Exception:
            return []

    def get_event_name(self, obj):
        try:
            enrollment = TeamEvent.objects.filter(team=obj, status=TeamEvent.STATUS_ENROLLED)\
                .select_related('event')\
                .order_by('-enrolled_at')\
                .first()
            if enrollment:
                return enrollment.event.name
        except Exception:
            return None
        return None

class SubmissionSerializer(serializers.ModelSerializer):
    # Team details
    team_event_details = TeamEventSerializer(source='team_event', read_only=True)
    team_details = TeamSerializer(source='team_event.team', read_only=True)
    team_name = serializers.ReadOnlyField(source='team_event.team.name')
    
    # Event via team
    event_name = serializers.ReadOnlyField(source='team_event.event.name')
    event = serializers.SerializerMethodField()
    
    # Submitted by
    submitted_by_username = serializers.ReadOnlyField(source='submitted_by.username')
    submitted_by_details = UserSerializer(source='submitted_by', read_only=True)
    
    # Feedback stats
    feedback_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    required_judges_count = serializers.SerializerMethodField()
    completed_judges_count = serializers.SerializerMethodField()
    all_judges_scored = serializers.SerializerMethodField()
    is_assigned_judge = serializers.SerializerMethodField()
    media_assets = MediaAssetSerializer(many=True, read_only=True)
    award_results = AwardResultSerializer(many=True, read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id',
            'team_event', 'team_event_details', 'team_details', 'team_name',
            'event', 'event_name',
            'submitted_by', 'submitted_by_username', 'submitted_by_details',
            'title', 'description', 'summary',
            'demo_url', 'repo_url', 'video_url',
            'technologies', 'key_features', 'screenshots',
            'file', 'created_at', 'score',
            'is_reviewed', 'is_winner',
            'winner_place', 'winner_prize',
            'is_locked_after_deadline', 'locked_at',
            'score_locked_at', 'score_locked_by_system',
            'feedback_count', 'average_score',
            'required_judges_count', 'completed_judges_count', 'all_judges_scored',
            'is_assigned_judge',
            'media_assets',
            'award_results',
        ]
        read_only_fields = ['score', 'submitted_by', 'is_reviewed']

    def get_event(self, obj):
        event = obj.team_event.event if obj.team_event else None
        if not event:
            return None
        return {
            'id': event.id,
            'name': event.name,
            'start_date': event.start_date,
            'end_date': event.end_date,
            'judging_criteria': event.judging_criteria,
            'status': event.get_status(),
            'registration_deadline': event.registration_deadline,
            'team_deadline': event.team_deadline,
            'submission_open_at': event.submission_open_at,
            'submission_deadline': event.submission_deadline,
            'judging_start': event.judging_start,
            'judging_end': event.judging_end,
            'reviewers_per_submission': event.reviewers_per_submission,
            'max_participants': event.max_participants,
        }
    
    def get_feedback_count(self, obj):
        return obj.feedback.count()
    
    def get_average_score(self, obj):
        if obj.feedback.exists():
            return sum(f.score for f in obj.feedback.all()) / obj.feedback.count()
        return None

    def get_required_judges_count(self, obj):
        try:
            return obj.team_event.event.reviewers_per_submission
        except Exception:
            return 0

    def get_completed_judges_count(self, obj):
        try:
            assigned = obj.judge_assignments.filter(is_active=True).values_list("judge_id", flat=True)
            if assigned:
                return obj.feedback.filter(judge_id__in=assigned).count()
            event = obj.team_event.event
            return obj.feedback.filter(judge__in=event.judges.all()).count()
        except Exception:
            return 0

    def get_all_judges_scored(self, obj):
        required = self.get_required_judges_count(obj)
        if required == 0:
            return False
        completed = self.get_completed_judges_count(obj)
        return completed >= required

    def get_is_assigned_judge(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        try:
            if obj.judge_assignments.filter(judge_id=request.user.id, is_active=True).exists():
                return True
            return obj.team_event.event.judges.filter(id=request.user.id).exists()
        except Exception:
            return False

class JudgeFeedbackSerializer(serializers.ModelSerializer):
    judge_details = UserSerializer(source='judge', read_only=True)
    judge_username = serializers.ReadOnlyField(source='judge.username')
    submission_title = serializers.ReadOnlyField(source='submission.title')
    
    class Meta:
        model = JudgeFeedback
        fields = ['id', 'submission', 'submission_title', 'judge', 'judge_details',
                  'judge_username', 'score', 'comment', 'criteria_scores',
                  'criteria_snapshot', 'created_at', 'updated_at']
        read_only_fields = ['judge']

# ========== ACTIVITY SERIALIZER ==========
class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'type', 'title', 'description', 'metadata', 
                  'is_important', 'created_at', 'team', 'submission', 'event']

# ========== USER REPORT SERIALIZER ==========
class UserReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.ReadOnlyField(source='reporter.username')
    reported_user_username = serializers.ReadOnlyField(source='reported_user.username')
    event_name = serializers.ReadOnlyField(source='event.name')
    reported_user_is_admin = serializers.SerializerMethodField()
    reported_user_is_organizer = serializers.SerializerMethodField()

    class Meta:
        model = UserReport
        fields = [
            'id', 'report_type', 'description', 'status',
            'reporter', 'reporter_username',
            'reported_user', 'reported_user_username', 'reported_username',
            'reported_user_is_admin', 'reported_user_is_organizer',
            'event', 'event_name',
            'created_at', 'updated_at',
            'reviewed_by', 'reviewed_at', 'resolution_note'
        ]
        read_only_fields = ['reporter', 'created_at', 'updated_at', 'reviewed_by', 'reviewed_at']

    def get_reported_user_is_admin(self, obj):
        try:
            return bool(obj.reported_user and (obj.reported_user.is_staff or obj.reported_user.is_superuser))
        except Exception:
            return False

    def get_reported_user_is_organizer(self, obj):
        try:
            if not obj.reported_user:
                return False
            profile = getattr(obj.reported_user, 'profile', None)
            return bool(getattr(profile, 'is_organizer', False))
        except Exception:
            return False

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

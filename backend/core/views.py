from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Post, Event, Team, Submission, JudgeFeedback,
    UserProfile, Activity, Follow, Tag, PostLike, PostRepost,
    ModerationAction, UserWarning, AccountDeletionLog,
    Conversation, ConversationParticipant, Message
)
from .serializers import (
    PostSerializer, EventSerializer, TeamSerializer,
    SubmissionSerializer, JudgeFeedbackSerializer,
    UserSerializer, RegisterSerializer, ActivitySerializer,
    UserDirectorySerializer, ConversationSerializer, MessageSerializer
)
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.permissions import BasePermission
from rest_framework import filters
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView

User = get_user_model()

# ========== HELPERS ==========
def is_admin(user):
    return user and user.is_authenticated and user.is_superuser

def is_judge(user):
    return user and user.is_authenticated and hasattr(user, 'profile') and user.profile.is_judge

def is_organizer(user):
    return user and user.is_authenticated and (
        user.is_staff or user.is_superuser or (hasattr(user, 'profile') and user.profile.is_organizer)
    )

def is_regular(user):
    return user and user.is_authenticated and not (is_admin(user) or is_organizer(user) or is_judge(user))

# ========== CUSTOM PERMISSIONS ==========
class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsOrganizerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return is_organizer(request.user) or is_admin(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_staff or
            request.user.is_superuser or
            obj.organizer == request.user
        )

class IsJudge(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and is_judge(request.user)

class IsOrganizerUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and is_organizer(request.user)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class IsJudgeOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_judge(request.user) or is_admin(request.user)


class IsNotBanned(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.is_active:
            return False
        profile = getattr(user, 'profile', None)
        now = timezone.now()
        if profile:
            if profile.banned_until and profile.banned_until > now:
                return False
            if profile.suspended_until and profile.suspended_until > now:
                return False
        return True

# ========== PAGINATION ==========
class PostPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 20

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# ========== USER VIEWS ==========
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    pagination_class = StandardPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ['destroy']:
            return [IsAuthenticated(), IsAdmin(), IsNotBanned()]
        if self.action in ['make_judge', 'remove_judge', 'warn', 'suspend', 'reactivate', 'ban']:
            return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]
        if self.action in ['me', 'list', 'retrieve', 'activities', 'change_password', 'verify_password',
                           'delete_account', 'directory', 'trending', 'suggested', 'follow', 'unfollow']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsNotBanned()]
    
    def get_serializer_class(self):
        if self.action in ['directory', 'trending', 'suggested']:
            return UserDirectorySerializer
        return UserSerializer
    
    # ========== EXISTING ACTIONS ==========
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def activities(self, request):
        """Get all activities for the logged-in user"""
        try:
            qs = Activity.objects.filter(user=request.user)
            scope = request.query_params.get('scope')
            if scope == 'inbound':
                inbound_types = [
                    'new_follower', 'feedback', 'review',
                    'role_removed', 'became_judge', 'became_organizer', 'winner',
                    'like', 'repost', 'reply'
                ]
                qs = qs.filter(type__in=inbound_types)
            activities = qs.order_by('-created_at')[:50]
            serializer = ActivitySerializer(activities, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching activities: {e}")
            return Response([])

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            try:
                profile, _ = UserProfile.objects.get_or_create(user=request.user)
                profile.last_active = timezone.now()
                profile.save()
            except Exception:
                pass
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            user = request.user
            data = request.data

            if 'first_name' in data:
                user.first_name = data.get('first_name', '')
            if 'last_name' in data:
                user.last_name = data.get('last_name', '')
            if 'email' in data:
                user.email = data.get('email', '')
            user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile_fields = [
                'organization_name', 'bio', 'location',
                'github_url', 'linkedin_url', 'twitter_url', 'website_url'
            ]
            for field in profile_fields:
                if field in data:
                    setattr(profile, field, data.get(field) or None)

            if 'avatar' in request.FILES:
                profile.avatar = request.FILES.get('avatar')
            if 'cover_image' in request.FILES:
                profile.cover_image = request.FILES.get('cover_image')

            profile.save()

            serializer = self.get_serializer(user)
            return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def active(self, request):
        """Get recently active users"""
        limit = request.query_params.get('limit')
        try:
            limit = int(limit) if limit else 8
        except ValueError:
            limit = 8

        cutoff = timezone.now() - timedelta(minutes=20)
        users = User.objects.filter(is_active=True, profile__last_active__gte=cutoff)\
            .select_related('profile')
        scope = request.query_params.get('scope')
        if scope == 'following':
            following_ids = Follow.objects.filter(follower=request.user)\
                .values_list('followed_id', flat=True)
            users = users.filter(id__in=following_ids)
        users = users.exclude(id=request.user.id)[:limit]
        serializer = UserDirectorySerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def make_judge(self, request, pk=None):
        """Make a user a judge. Organizers/admins only."""
        if not is_organizer(request.user):
            return Response({"error": "Only organizers can assign judge roles."}, status=status.HTTP_403_FORBIDDEN)

        target_user = self.get_object()

        if target_user == request.user:
            return Response({"error": "You cannot make yourself a judge."}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.teams.exists():
            return Response({"error": f"{target_user.username} is on a team. Remove them from all teams first."}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.submissions_made.exists():
            return Response({"error": f"{target_user.username} has existing submissions. Cannot make a participant a judge."}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        profile.is_judge = True
        profile.save()

        from .utils.activity_helpers import create_judge_activity
        create_judge_activity(target_user, made_by=request.user)

        return Response({"success": f"{target_user.username} is now a judge.", "user": UserSerializer(target_user, context={'request': request}).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def remove_judge(self, request, pk=None):
        """Remove judge role. Organizers/admins only."""
        if not is_organizer(request.user):
            return Response({"error": "Only organizers can remove judge roles."}, status=status.HTTP_403_FORBIDDEN)

        target_user = self.get_object()
        profile, _ = UserProfile.objects.get_or_create(user=target_user)

        if not profile.is_judge:
            return Response({"error": f"{target_user.username} is not a judge."}, status=status.HTTP_400_BAD_REQUEST)

        profile.is_judge = False
        profile.save()

        from .utils.activity_helpers import create_role_removed_activity
        create_role_removed_activity(target_user, 'judge', removed_by=request.user)

        return Response({"success": f"Judge role removed from {target_user.username}.", "user": UserSerializer(target_user, context={'request': request}).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def warn(self, request, pk=None):
        """Warn a user. Organizers/admins only."""
        target_user = self.get_object()
        reason = request.data.get('reason')
        message = request.data.get('message')

        UserWarning.objects.create(
            user=target_user,
            warned_by=request.user,
            reason=reason,
            message=message
        )

        ModerationAction.objects.create(
            moderator=request.user,
            target_user=target_user,
            action_type=ModerationAction.ACTION_WARN,
            reason=reason
        )

        return Response({"success": f"{target_user.username} has been warned."})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def suspend(self, request, pk=None):
        """Suspend a user for a duration (days). Organizers/admins only."""
        target_user = self.get_object()
        duration_days = request.data.get('duration_days') or request.data.get('duration')

        try:
            duration_days = int(duration_days)
        except (TypeError, ValueError):
            return Response({"error": "duration_days is required and must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        if duration_days <= 0:
            return Response({"error": "duration_days must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        expires_at = timezone.now() + timedelta(days=duration_days)
        profile.suspended_until = expires_at
        profile.save()

        target_user.is_active = False
        target_user.save()

        ModerationAction.objects.create(
            moderator=request.user,
            target_user=target_user,
            action_type=ModerationAction.ACTION_SUSPEND,
            duration=timedelta(days=duration_days),
            expires_at=expires_at
        )

        return Response({"success": f"{target_user.username} has been suspended.", "suspended_until": expires_at})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reactivate(self, request, pk=None):
        """Reactivate a suspended/banned user. Organizers/admins only."""
        target_user = self.get_object()
        profile, _ = UserProfile.objects.get_or_create(user=target_user)

        profile.suspended_until = None
        profile.banned_until = None
        profile.ban_reason = None
        profile.save()

        target_user.is_active = True
        target_user.save()

        ModerationAction.objects.create(
            moderator=request.user,
            target_user=target_user,
            action_type=ModerationAction.ACTION_REACTIVATE
        )

        return Response({"success": f"{target_user.username} has been reactivated."})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def ban(self, request, pk=None):
        """Ban a user with a grace period (default 30 days). Organizers/admins only."""
        target_user = self.get_object()

        if (is_organizer(target_user) or is_admin(target_user)) and not is_admin(request.user):
            return Response({"error": "Only admins can ban organizers or admins."}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason')
        duration_days = request.data.get('duration_days') or 30

        try:
            duration_days = int(duration_days)
        except (TypeError, ValueError):
            duration_days = 30

        if duration_days <= 0:
            duration_days = 30

        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        expires_at = timezone.now() + timedelta(days=duration_days)
        profile.banned_until = expires_at
        profile.ban_reason = reason
        profile.save()

        target_user.is_active = False
        target_user.save()

        ModerationAction.objects.create(
            moderator=request.user,
            target_user=target_user,
            action_type=ModerationAction.ACTION_BAN,
            reason=reason,
            duration=timedelta(days=duration_days),
            expires_at=expires_at
        )

        return Response({"success": f"{target_user.username} has been banned.", "banned_until": expires_at})
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def verify_password(self, request):
        """Verify user's password before deleting account"""
        user = request.user
        password = request.data.get('password')
        
        if not password:
            return Response(
                {"error": "Password required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.check_password(password):
            return Response({"success": "Password verified"})
        else:
            return Response(
                {"error": "Incorrect password"},
                status=status.HTTP_403_FORBIDDEN
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        user = request.user
        data = request.data
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {"error": "Current password and new password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        try:
            from .utils.activity_helpers import create_password_change_activity
            create_password_change_activity(user)
        except ImportError:
            pass  # Activity helper not available
        
        return Response({"success": "Password changed successfully"})

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_account(self, request):
        """Delete the authenticated user's account"""
        user = request.user
        reason = request.data.get('reason')
        
        # Check if user is team leader with other members
        if Team.objects.filter(leader=user).annotate(member_count=Count('members')).filter(member_count__gt=1).exists():
            return Response(
                {"error": "Cannot delete account while you are leading a team with members."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has pending submissions
        if user.submissions_made.filter(is_reviewed=False).exists():
            return Response(
                {"error": "Cannot delete account with pending submissions."},
                status=status.HTTP_400_BAD_REQUEST
            )

        AccountDeletionLog.objects.create(
            user_id=user.id,
            username=user.username,
            email=user.email,
            reason=reason,
            deleted_by=user
        )
        
        # Delete the user
        user.delete()
        return Response({"success": "Account deleted successfully"}, status=status.HTTP_200_OK)

    # ========== NEW ACTIONS FOR USERS PAGE ==========

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def directory(self, request):
        """Get all users for the directory page with role information and stats"""
        try:
            users = User.objects.filter(is_active=True).select_related('profile')

            # Annotate with counts
            users = users.annotate(
                posts_count=Count('posts', distinct=True),
            )

            # Paginate the results
            page = self.paginate_queryset(users)
            if page is not None:
                serializer = self.get_serializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(users, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            print(f"ERROR in directory endpoint: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def trending(self, request):
        """Get trending users based on activity"""
        # Users with most posts/followers in last 30 days
        last_month = timezone.now() - timedelta(days=30)

        users = User.objects.filter(is_active=True).select_related('profile')
        users = users.annotate(
            recent_posts=Count('posts', filter=Q(posts__created_at__gte=last_month), distinct=True),
            posts_count=Count('posts', distinct=True),
            followers_count=Count('followers_set', distinct=True)
        ).order_by('-recent_posts', '-posts_count', '-followers_count')[:10]

        serializer = self.get_serializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def suggested(self, request):
        """Get suggested users for the current user to follow"""
        if not request.user.is_authenticated:
            return Response([])

        # Get users that the current user is not already following
        following_ids = Follow.objects.filter(
            follower=request.user
        ).values_list('followed_id', flat=True)

        users = User.objects.filter(is_active=True)\
            .exclude(id=request.user.id)\
            .exclude(id__in=following_ids)\
            .select_related('profile')

        # Prioritize users with most posts/followers
        users = users.annotate(
            posts_count=Count('posts', distinct=True),
            followers_count=Count('followers_set', distinct=True)
        ).order_by('-posts_count', '-followers_count')[:10]

        serializer = self.get_serializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        """Follow a user"""
        target_user = self.get_object()

        if target_user == request.user:
            return Response(
                {"error": "You cannot follow yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already following
        if Follow.objects.filter(follower=request.user, followed=target_user).exists():
            return Response(
                {"error": f"You are already following {target_user.username}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create follow relationship
        Follow.objects.create(
            follower=request.user,
            followed=target_user
        )

        # Create activity (optional)
        try:
            from .utils.activity_helpers import create_follow_activity
            create_follow_activity(request.user, target_user)
        except ImportError:
            pass

        return Response({
            "success": f"You are now following {target_user.username}",
            "followers_count": target_user.followers_set.count()
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unfollow(self, request, pk=None):
        """Unfollow a user"""
        target_user = self.get_object()

        if target_user == request.user:
            return Response(
                {"error": "You cannot unfollow yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if following
        follow = Follow.objects.filter(
            follower=request.user,
            followed=target_user
        ).first()

        if not follow:
            return Response(
                {"error": f"You are not following {target_user.username}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete follow relationship
        follow.delete()

        return Response({
            "success": f"You have unfollowed {target_user.username}",
            "followers_count": target_user.followers_set.count()
        })


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# ========== POST VIEWS ==========
class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsNotBanned]
    pagination_class = PostPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'pinned_at']

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsNotBanned(), IsOwner()]
        if self.action in ['pin']:
            return [IsAuthenticated(), IsNotBanned(), IsOrganizerOrAdmin()]
        return [IsAuthenticated(), IsNotBanned()]

    def get_queryset(self):
        qs = Post.objects.select_related('owner', 'event')\
            .prefetch_related('tags', 'likes', 'reposts')

        if self.action != 'comments':
            qs = qs.filter(parent__isnull=True)

        qs = qs.filter(is_deleted=False)

        now = timezone.now()
        qs = qs.filter(Q(scheduled_for__isnull=True) | Q(scheduled_for__lte=now))

        post_type = self.request.query_params.get('post_type')
        if post_type:
            qs = qs.filter(post_type=post_type)

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__name=tag.strip().lower())

        feed = self.request.query_params.get('feed')
        following = self.request.query_params.get('following')
        if feed == 'following' or (following and following.lower() in ['1', 'true', 'yes']):
            following_ids = Follow.objects.filter(follower=self.request.user)\
                .values_list('followed_id', flat=True)
            qs = qs.filter(owner_id__in=following_ids)

        ordering = self.request.query_params.get('ordering')
        if ordering:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-is_pinned', '-pinned_at', '-created_at')

        return qs.distinct()

    def perform_create(self, serializer):
        post_type = serializer.validated_data.get('post_type', Post.POST_TYPE_POST)
        parent = serializer.validated_data.get('parent')

        if parent is not None:
            post_type = Post.POST_TYPE_POST

        if post_type in [Post.POST_TYPE_ANNOUNCEMENT, Post.POST_TYPE_RESULT]:
            if not (is_organizer(self.request.user) or is_admin(self.request.user)):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Only organizers or admins can create announcements or results.")

        post = serializer.save(owner=self.request.user, post_type=post_type)

        if parent is not None:
            try:
                from .utils.activity_helpers import create_reply_activity
                create_reply_activity(self.request.user, parent)
            except Exception as e:
                print(f"Error creating reply activity: {e}")

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(user=request.user, post=post)
        if created:
            try:
                from .utils.activity_helpers import create_like_activity
                create_like_activity(request.user, post)
            except Exception as e:
                print(f"Error creating like activity: {e}")
        else:
            like.delete()
            try:
                from .utils.activity_helpers import remove_like_activity
                remove_like_activity(request.user, post)
            except Exception as e:
                print(f"Error removing like activity: {e}")
        return Response({
            "liked": created,
            "likes_count": post.likes.count(),
            "liked_by": list(post.likes.values_list('user_id', flat=True))
        })

    @action(detail=True, methods=['post'])
    def repost(self, request, pk=None):
        post = self.get_object()
        repost, created = PostRepost.objects.get_or_create(user=request.user, post=post)
        if created:
            try:
                from .utils.activity_helpers import create_repost_activity
                create_repost_activity(request.user, post)
            except Exception as e:
                print(f"Error creating repost activity: {e}")
        else:
            repost.delete()
            try:
                from .utils.activity_helpers import remove_repost_activity
                remove_repost_activity(request.user, post)
            except Exception as e:
                print(f"Error removing repost activity: {e}")
        return Response({
            "reposted": created,
            "reposts_count": post.reposts.count(),
            "reposted_by": list(post.reposts.values_list('user_id', flat=True))
        })

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        post = self.get_object()
        qs = Post.objects.filter(parent=post, is_deleted=False)\
            .select_related('owner', 'event')\
            .prefetch_related('tags', 'likes', 'reposts')\
            .order_by('created_at')
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        post = self.get_object()
        if post.is_pinned:
            post.is_pinned = False
            post.pinned_at = None
        else:
            post.is_pinned = True
            post.pinned_at = timezone.now()
        post.save()
        return Response({
            "success": True,
            "is_pinned": post.is_pinned,
            "pinned_at": post.pinned_at
        })

    @action(detail=False, methods=['get'], url_path='trending-tags')
    def trending_tags(self, request):
        tags = Tag.objects.annotate(post_count=Count('posts'))\
            .order_by('-post_count', 'name')[:10]
        return Response([t.name for t in tags])

# ========== EVENT VIEWS ==========
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-start_date')
    serializer_class = EventSerializer
    permission_classes = [IsOrganizerOrAdmin]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=["get"])
    def teams(self, request, pk=None):
        event = self.get_object()
        serializer = TeamSerializer(event.teams.all(), many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        event = self.get_object()
        teams = event.teams.all()
        submissions = Submission.objects.filter(team__in=teams)
        serializer = SubmissionSerializer(submissions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def live(self, request):
        now = timezone.now()
        events = Event.objects.filter(start_date__lte=now, end_date__gte=now).order_by('start_date')
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

# ========== TEAM VIEWS ==========
class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if is_judge(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Judges cannot create or join teams.")
        team = serializer.save()
        team.members.add(user)
        if hasattr(team, 'leader'):
            team.leader = user
            team.save()

        _ensure_team_conversation(team)
        
        from .utils.activity_helpers import create_team_activity
        create_team_activity(user, team, 'team_create')

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        team = self.get_object()

        if is_judge(request.user):
            return Response({"message": "Judges cannot join teams."}, status=status.HTTP_403_FORBIDDEN)

        if team.members.filter(id=request.user.id).exists():
            return Response({"message": "You are already a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

        max_members = getattr(team, 'max_members', 4)
        if team.members.count() >= max_members:
            return Response({"message": "This team is full."}, status=status.HTTP_400_BAD_REQUEST)

        team.members.add(request.user)

        _ensure_team_conversation(team)
        
        from .utils.activity_helpers import create_team_activity
        create_team_activity(request.user, team, 'team_join')
        
        serializer = self.get_serializer(team)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        team = self.get_object()

        if not team.members.filter(id=request.user.id).exists():
            return Response({"message": "You are not a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(team, 'leader') and team.leader == request.user:
            return Response({"message": "You are the team leader. Delete the team or transfer leadership instead."}, status=status.HTTP_400_BAD_REQUEST)

        team.members.remove(request.user)

        # Remove user from the team conversation participants if it exists
        try:
            convo = Conversation.objects.filter(is_team=True, team=team).first()
            if convo:
                ConversationParticipant.objects.filter(conversation=convo, user=request.user).delete()
        except Exception:
            pass
        
        from .utils.activity_helpers import create_team_activity
        create_team_activity(request.user, team, 'team_leave')
        
        serializer = self.get_serializer(team)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(id=user_id)
            team.members.add(user)
            return Response({"status": "member added", "user": user.username})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(id=user_id)
            team.members.remove(user)
            return Response({"status": "member removed", "user": user.username})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        team = self.get_object()
        serializer = UserSerializer(team.members.all(), many=True, context={'request': request})
        return Response(serializer.data)

# ========== SUBMISSION VIEWS ==========
class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if is_judge(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Judges cannot submit projects.")
        submission = serializer.save(submitted_by=user)
        
        from .utils.activity_helpers import create_submission_activity
        create_submission_activity(user, submission)

    @action(detail=True, methods=["get", "post", "put", "delete"])
    def feedback(self, request, pk=None):
        submission = self.get_object()

        if request.method == "GET":
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            feedbacks = submission.feedback.all().order_by('-created_at')
            serializer = JudgeFeedbackSerializer(feedbacks, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method in ["POST", "PUT"]:
            if not (is_judge(request.user) or is_organizer(request.user) or request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "Only judges, organizers, and admins can submit feedback."},
                    status=status.HTTP_403_FORBIDDEN
                )

            existing = submission.feedback.filter(judge=request.user).first()
            
            if existing and request.method == "POST":
                return Response(
                    {"error": "You already submitted feedback. Use PUT to update."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = request.data.copy()
            if 'submission' not in data:
                data['submission'] = submission.id
            
            if existing:
                serializer = JudgeFeedbackSerializer(existing, data=data, partial=True, context={'request': request})
            else:
                serializer = JudgeFeedbackSerializer(data=data, context={'request': request})

            if serializer.is_valid():
                feedback = serializer.save(judge=request.user, submission=submission)
                submission.update_score()
                
                from .utils.activity_helpers import create_feedback_activity
                for member in submission.team.members.all():
                    create_feedback_activity(member, feedback)
                
                return Response(serializer.data, status=status.HTTP_200_OK if existing else status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == "DELETE":
            feedback_id = request.data.get('feedback_id')
            if not feedback_id:
                return Response(
                    {"error": "feedback_id required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                feedback = JudgeFeedback.objects.get(id=feedback_id, submission=submission)
            except JudgeFeedback.DoesNotExist:
                return Response(
                    {"error": "Feedback not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not (feedback.judge == request.user or is_organizer(request.user) or request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "You don't have permission to delete this feedback."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            feedback.delete()
            submission.update_score()
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path='mark-winner')
    def mark_winner(self, request, pk=None):
        if not is_organizer(request.user):
            return Response({"error": "Only organizers can mark winners."}, status=status.HTTP_403_FORBIDDEN)

        submission = self.get_object()
        submission.is_winner = request.data.get('is_winner', True)
        submission.is_reviewed = True
        submission.winner_place = request.data.get('winner_place', '')
        submission.winner_prize = request.data.get('winner_prize', '')
        submission.save()
        
        from .utils.activity_helpers import create_winner_activity
        for member in submission.team.members.all():
            create_winner_activity(member, submission)
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_score(self, request, pk=None):
        submission = self.get_object()
        score = request.data.get("score")
        if score is not None:
            submission.score = score
            submission.save()
            return Response({"status": "score updated", "score": score})
        return Response({"error": "score required"}, status=status.HTTP_400_BAD_REQUEST)

# ========== JUDGE FEEDBACK VIEWS ==========
class JudgeFeedbackViewSet(viewsets.ModelViewSet):
    queryset = JudgeFeedback.objects.all()
    serializer_class = JudgeFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_judge(user) or is_organizer(user):
            return JudgeFeedback.objects.all().order_by('-created_at')
        return JudgeFeedback.objects.filter(
            submission__team__members=user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(judge=self.request.user)

    def update(self, request, *args, **kwargs):
        feedback = self.get_object()
        if feedback.judge != request.user and not request.user.is_staff:
            return Response({"error": "You can only edit your own feedback."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        feedback = self.get_object()
        if feedback.judge != request.user and not request.user.is_staff:
            return Response({"error": "You can only delete your own feedback."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


def _get_direct_conversation(user, recipient):
    qs = Conversation.objects.filter(is_team=False)\
        .annotate(pcount=Count('participants'))\
        .filter(pcount=2, participants=user)\
        .filter(participants=recipient)
    return qs.first()


def _ensure_team_conversation(team):
    convo = Conversation.objects.filter(is_team=True, team=team).first()
    if not convo:
        convo = Conversation.objects.create(is_team=True, team=team)
    members = team.members.all()
    for member in members:
        ConversationParticipant.objects.get_or_create(conversation=convo, user=member)
    return convo


class ConversationListCreate(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request):
        # Ensure team conversations exist for all teams the user is in
        try:
            teams = Team.objects.filter(members=request.user)
            for team in teams:
                _ensure_team_conversation(team)
        except Exception:
            pass

        convos = Conversation.objects.filter(participants=request.user)\
            .select_related('team')\
            .prefetch_related('participants', 'messages')\
            .order_by('-updated_at')
        serializer = ConversationSerializer(convos, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        if not recipient_id:
            return Response({"error": "recipient_id required"}, status=status.HTTP_400_BAD_REQUEST)
        if str(recipient_id) == str(request.user.id):
            return Response({"error": "Cannot message yourself"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        convo = _get_direct_conversation(request.user, recipient)
        if not convo:
            convo = Conversation.objects.create(is_team=False)
            ConversationParticipant.objects.get_or_create(conversation=convo, user=request.user)
            ConversationParticipant.objects.get_or_create(conversation=convo, user=recipient)

        serializer = ConversationSerializer(convo, context={'request': request})
        return Response(serializer.data)


class ConversationMessages(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request, pk):
        try:
            convo = Conversation.objects.get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        if not ConversationParticipant.objects.filter(conversation=convo, user=request.user).exists():
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = convo.messages.select_related('sender').order_by('created_at')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = MessageSerializer(page if page is not None else qs, many=True, context={'request': request})

        link = ConversationParticipant.objects.get(conversation=convo, user=request.user)
        link.last_read_at = timezone.now()
        link.save(update_fields=['last_read_at'])

        if page is not None:
            return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            convo = Conversation.objects.get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        if not ConversationParticipant.objects.filter(conversation=convo, user=request.user).exists():
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "content required"}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(conversation=convo, sender=request.user, content=content)
        convo.save(update_fields=['updated_at'])

        link = ConversationParticipant.objects.get(conversation=convo, user=request.user)
        link.last_read_at = timezone.now()
        link.save(update_fields=['last_read_at'])

        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageUnreadCount(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request):
        total = 0
        convos = Conversation.objects.filter(participants=request.user)
        for convo in convos:
            try:
                link = ConversationParticipant.objects.get(conversation=convo, user=request.user)
            except ConversationParticipant.DoesNotExist:
                continue
            qs = convo.messages.exclude(sender=request.user)
            if link.last_read_at:
                qs = qs.filter(created_at__gt=link.last_read_at)
            total += qs.count()
        return Response({"count": total})


class TeamMessages(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request, team_id):
        try:
            team = Team.objects.get(pk=team_id)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=status.HTTP_404_NOT_FOUND)

        if not team.members.filter(id=request.user.id).exists():
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        convo = _ensure_team_conversation(team)
        qs = convo.messages.select_related('sender').order_by('created_at')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = MessageSerializer(page if page is not None else qs, many=True, context={'request': request})

        link = ConversationParticipant.objects.get(conversation=convo, user=request.user)
        link.last_read_at = timezone.now()
        link.save(update_fields=['last_read_at'])

        if page is not None:
            return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def post(self, request, team_id):
        try:
            team = Team.objects.get(pk=team_id)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=status.HTTP_404_NOT_FOUND)

        if not team.members.filter(id=request.user.id).exists():
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "content required"}, status=status.HTTP_400_BAD_REQUEST)

        convo = _ensure_team_conversation(team)
        msg = Message.objects.create(conversation=convo, sender=request.user, content=content)
        convo.save(update_fields=['updated_at'])

        link = ConversationParticipant.objects.get(conversation=convo, user=request.user)
        link.last_read_at = timezone.now()
        link.save(update_fields=['last_read_at'])

        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationsUnreadCount(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request):
        return Response({"count": 0})

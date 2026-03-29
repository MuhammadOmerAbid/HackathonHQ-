from rest_framework import viewsets, permissions, status
import json
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Post, Event, Team, TeamEvent, Submission, JudgeFeedback,
    EventResource, EventSponsor, AwardCategory, AwardResult,
    JudgeAssignment, Notification, Announcement, MediaAsset, AuditLog,
    UserProfile, Activity, Follow, Tag, PostLike, PostRepost,
    ModerationAction, UserWarning, AccountDeletionLog,
    Conversation, ConversationParticipant, Message
)
from .serializers import (
    PostSerializer, EventSerializer, TeamSerializer, TeamEventSerializer,
    SubmissionSerializer, JudgeFeedbackSerializer,
    EventResourceSerializer, EventSponsorSerializer,
    AwardCategorySerializer, AwardResultSerializer,
    JudgeAssignmentSerializer, NotificationSerializer,
    AnnouncementSerializer, MediaAssetSerializer,
    UserSerializer, RegisterSerializer, ActivitySerializer,
    UserDirectorySerializer, ConversationSerializer, MessageSerializer
)
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.permissions import BasePermission
from rest_framework import filters
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from django.http import StreamingHttpResponse
from django.core.serializers.json import DjangoJSONEncoder
import json
import time
from rest_framework.exceptions import PermissionDenied

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


def _notify_users(users, n_type, title, body="", link=""):
    try:
        for u in users:
            Notification.objects.create(
                user=u,
                type=n_type,
                title=title,
                body=body,
                link=link
            )
    except Exception:
        pass

def _get_event_participants(event):
    try:
        team_ids = TeamEvent.objects.filter(
            event=event,
            status=TeamEvent.STATUS_ENROLLED
        ).values_list("team_id", flat=True)
        return User.objects.filter(teams__id__in=team_ids).distinct()
    except Exception:
        return User.objects.none()

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
                           'delete_account', 'directory', 'trending', 'suggested', 'follow', 'unfollow', 'judges']:
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def judges(self, request):
        """List eligible judges (organizers can assign)."""
        q = (request.query_params.get('q') or '').strip()
        qs = User.objects.filter(profile__is_judge=True).select_related('profile').order_by('username')
        if q:
            qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q))
        serializer = UserSerializer(qs[:100], many=True, context={'request': request})
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
            .prefetch_related('tags', 'likes', 'reposts', 'reposts__user__profile')

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

        author_id = self.request.query_params.get('author')
        if author_id:
            qs = qs.filter(owner_id=author_id)

        feed = self.request.query_params.get('feed')
        following = self.request.query_params.get('following')
        if feed == 'following' or (following and following.lower() in ['1', 'true', 'yes']):
            following_ids = Follow.objects.filter(follower=self.request.user)\
                .values_list('followed_id', flat=True)
            qs = qs.filter(Q(owner_id__in=following_ids) | Q(reposts__user_id__in=following_ids))

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

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'live', 'status', 'winners']:
            return [AllowAny()]
        if self.action in ['teams', 'submissions']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]

    def get_queryset(self):
        qs = Event.objects.all().order_by('-start_date')
        now = timezone.now()
        for event in qs:
            try:
                if not event.status_override:
                    prev = event.status
                    computed = event.get_status(now=now)
                    if prev != computed:
                        event.status = computed
                        event.save(update_fields=["status"])
                        try:
                            if computed == Event.STATUS_JUDGING:
                                participants = _get_event_participants(event)
                                _notify_users(
                                    participants,
                                    "judging_started",
                                    "Judging has started",
                                    body=f"Judging for {event.name} is now open.",
                                    link=f"/events/{event.id}"
                                )
                            if computed == Event.STATUS_FINISHED:
                                try:
                                    Submission.objects.filter(
                                        team_event__event=event,
                                        score_locked_by_system=False
                                    ).update(
                                        score_locked_by_system=True,
                                        score_locked_at=now
                                    )
                                except Exception:
                                    pass
                                try:
                                    if not AwardResult.objects.filter(event=event).exists():
                                        _compute_event_winners(event, top_n=3)
                                except Exception:
                                    pass
                                participants = _get_event_participants(event)
                                _notify_users(
                                    participants,
                                    "judging_ended",
                                    "Judging has ended",
                                    body=f"Judging for {event.name} has closed.",
                                    link=f"/events/{event.id}"
                                )
                                _notify_users(
                                    participants,
                                    "results_announced",
                                    "Results announced",
                                    body=f"Results for {event.name} are now available.",
                                    link=f"/events/{event.id}"
                                )
                        except Exception:
                            pass
            except Exception:
                pass
        return qs

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=["get"])
    def teams(self, request, pk=None):
        event = self.get_object()
        team_ids = TeamEvent.objects.filter(
            event=event,
            status=TeamEvent.STATUS_ENROLLED
        ).values_list("team_id", flat=True)
        serializer = TeamSerializer(
            Team.objects.filter(id__in=team_ids),
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        event = self.get_object()
        submissions = Submission.objects.filter(team_event__event=event)
        serializer = SubmissionSerializer(submissions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        event = self.get_object()
        return Response({
            "status": event.get_status(),
            "status_override": event.status_override,
            "registration_deadline": event.registration_deadline,
            "team_deadline": event.team_deadline,
            "submission_open_at": event.submission_open_at,
            "submission_deadline": event.submission_deadline,
            "judging_start": event.judging_start,
            "judging_end": event.judging_end,
        })

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated, IsOrganizerOrAdmin])
    def status_override(self, request, pk=None):
        event = self.get_object()
        override = request.data.get("status_override")
        if override is not None and override != "":
            if override not in dict(Event.STATUS_CHOICES):
                return Response({"error": "Invalid status_override"}, status=status.HTTP_400_BAD_REQUEST)
            event.status_override = override
        else:
            event.status_override = None
        event.refresh_status(save=True)
        return Response({"status": event.status, "status_override": event.status_override})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsOrganizerOrAdmin])
    def assign_judges(self, request, pk=None):
        event = self.get_object()
        if not (request.user.is_staff or request.user.is_superuser or event.organizer == request.user):
            return Response({"error": "Only the organizer can assign judges."},
                            status=status.HTTP_403_FORBIDDEN)

        judges = list(event.judges.all())
        if not judges:
            return Response({"error": "No judges assigned to this event."},
                            status=status.HTTP_400_BAD_REQUEST)

        target = event.reviewers_per_submission or 0
        submissions = Submission.objects.filter(team_event__event=event)
        if target <= 0:
            return Response({"error": "reviewers_per_submission must be > 0."},
                            status=status.HTTP_400_BAD_REQUEST)

        loads = {j.id: JudgeAssignment.objects.filter(event=event, judge=j, is_active=True).count() for j in judges}
        created = 0
        for sub in submissions:
            existing = set(sub.judge_assignments.filter(is_active=True).values_list("judge_id", flat=True))
            needed = max(0, target - len(existing))
            if needed == 0:
                continue
            eligible = [j for j in judges if j.id not in existing]
            eligible.sort(key=lambda j: loads.get(j.id, 0))
            for j in eligible[:needed]:
                assignment, was_created = JudgeAssignment.objects.get_or_create(
                    event=event,
                    submission=sub,
                    judge=j,
                    defaults={"is_active": True}
                )
                if not was_created and not assignment.is_active:
                    assignment.is_active = True
                    assignment.override_reason = "auto_reactivated"
                    assignment.save(update_fields=["is_active", "override_reason"])
                created += 1
                loads[j.id] = loads.get(j.id, 0) + 1
        return Response({"assigned": created})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsOrganizerOrAdmin])
    def assignments_override(self, request, pk=None):
        event = self.get_object()
        submission_id = request.data.get("submission")
        judge_id = request.data.get("judge")
        is_active = request.data.get("is_active", True)
        override_reason = request.data.get("override_reason", "organizer_override")
        if not submission_id or not judge_id:
            return Response({"error": "submission and judge are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            submission = Submission.objects.get(id=submission_id, team_event__event=event)
        except Submission.DoesNotExist:
            return Response({"error": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            judge = User.objects.get(id=judge_id)
        except User.DoesNotExist:
            return Response({"error": "Judge not found"}, status=status.HTTP_404_NOT_FOUND)

        assignment, _ = JudgeAssignment.objects.get_or_create(
            event=event, submission=submission, judge=judge,
            defaults={"is_active": bool(is_active), "override_reason": override_reason}
        )
        assignment.is_active = bool(is_active)
        assignment.override_reason = override_reason
        assignment.save()
        return Response(JudgeAssignmentSerializer(assignment, context={'request': request}).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def enroll_team(self, request, pk=None):
        event = self.get_object()
        team_id = request.data.get("team")
        if not team_id:
            return Response({"error": "team is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=status.HTTP_404_NOT_FOUND)

        allowed, reason = TeamEvent.can_enroll(team, event, request.user)
        if not allowed:
            if team.leader:
                n_type = "team_enroll_capped" if reason == "Event is at capacity." else "team_enroll_failed"
                _notify_users(
                    [team.leader],
                    n_type,
                    "Enrollment failed",
                    body=reason,
                    link=f"/events/{event.id}"
                )
            return Response({"error": reason}, status=status.HTTP_403_FORBIDDEN)

        enrollment, created = TeamEvent.objects.get_or_create(team=team, event=event)
        enrollment.status = TeamEvent.STATUS_ENROLLED
        enrollment.enrolled_at = timezone.now()
        enrollment.withdrawn_at = None
        enrollment.disqualified_at = None
        enrollment.status_changed_by = request.user
        enrollment.status_reason = request.data.get("reason")
        enrollment.save()

        if team.leader:
            _notify_users(
                [team.leader],
                "team_enrolled_success",
                "Team enrolled",
                body=f'Your team "{team.name}" is enrolled in {event.name}.',
                link=f"/events/{event.id}"
            )

        try:
            AuditLog.objects.create(
                actor=request.user,
                entity_type="TeamEvent",
                entity_id=str(enrollment.id),
                action="team_enrolled",
                before={},
                after={"team_id": team.id, "event_id": event.id, "status": enrollment.status}
            )
        except Exception:
            pass

        return Response(TeamEventSerializer(enrollment, context={'request': request}).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def withdraw_team(self, request, pk=None):
        event = self.get_object()
        team_id = request.data.get("team")
        if not team_id:
            return Response({"error": "team is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=status.HTTP_404_NOT_FOUND)

        is_org = is_organizer(request.user) or request.user.is_staff or request.user.is_superuser
        if not (team.leader == request.user or is_org):
            return Response({"error": "Only team leader or organizers can withdraw."}, status=status.HTTP_403_FORBIDDEN)

        enrollment = TeamEvent.objects.filter(team=team, event=event).first()
        if not enrollment:
            return Response({"error": "Team is not enrolled in this event."}, status=status.HTTP_400_BAD_REQUEST)

        enrollment.status = TeamEvent.STATUS_WITHDRAWN
        enrollment.withdrawn_at = timezone.now()
        enrollment.status_changed_by = request.user
        enrollment.status_reason = request.data.get("reason")
        enrollment.save()

        if team.leader:
            _notify_users(
                [team.leader],
                "team_withdrawn",
                "Team withdrawn",
                body=f'Your team "{team.name}" withdrew from {event.name}.',
                link=f"/events/{event.id}"
            )

        try:
            AuditLog.objects.create(
                actor=request.user,
                entity_type="TeamEvent",
                entity_id=str(enrollment.id),
                action="team_withdrawn",
                before={},
                after={"team_id": team.id, "event_id": event.id, "status": enrollment.status}
            )
        except Exception:
            pass

        return Response(TeamEventSerializer(enrollment, context={'request': request}).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsOrganizerOrAdmin])
    def disqualify_team(self, request, pk=None):
        event = self.get_object()
        team_id = request.data.get("team")
        if not team_id:
            return Response({"error": "team is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=status.HTTP_404_NOT_FOUND)

        enrollment = TeamEvent.objects.filter(team=team, event=event).first()
        if not enrollment:
            enrollment = TeamEvent.objects.create(team=team, event=event)

        enrollment.status = TeamEvent.STATUS_DISQUALIFIED
        enrollment.disqualified_at = timezone.now()
        enrollment.status_changed_by = request.user
        enrollment.status_reason = request.data.get("reason")
        enrollment.save()

        if team.leader:
            _notify_users(
                [team.leader],
                "team_disqualified",
                "Team disqualified",
                body=f'Your team "{team.name}" was disqualified from {event.name}.',
                link=f"/events/{event.id}"
            )

        try:
            AuditLog.objects.create(
                actor=request.user,
                entity_type="TeamEvent",
                entity_id=str(enrollment.id),
                action="team_disqualified",
                before={},
                after={"team_id": team.id, "event_id": event.id, "status": enrollment.status}
            )
        except Exception:
            pass

        return Response(TeamEventSerializer(enrollment, context={'request': request}).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsOrganizerOrAdmin])
    def compute_winners(self, request, pk=None):
        event = self.get_object()
        top_n = int(request.data.get("top_n") or 3)
        data = _compute_event_winners(event, top_n=top_n)
        return Response(data)

    @action(detail=True, methods=["get"])
    def winners(self, request, pk=None):
        event = self.get_object()
        if event.get_status() != Event.STATUS_FINISHED:
            if not (request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser or event.organizer == request.user)):
                return Response({"error": "Results are not public yet."}, status=status.HTTP_403_FORBIDDEN)
        results = AwardResult.objects.filter(event=event).order_by("category_id", "place")
        return Response(AwardResultSerializer(results, many=True).data)

    @action(detail=True, methods=["get", "put"], permission_classes=[IsAuthenticated, IsOrganizerOrAdmin])
    def judges(self, request, pk=None):
        event = self.get_object()
        if not (request.user.is_staff or request.user.is_superuser or event.organizer == request.user):
            return Response({"error": "Only the organizer can manage judges for this event."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == "GET":
            serializer = UserSerializer(event.judges.all(), many=True, context={'request': request})
            return Response({
                "count": event.judges.count(),
                "judges": serializer.data
            })

        judge_ids = request.data.get('judges', [])
        if isinstance(judge_ids, str):
            judge_ids = [j.strip() for j in judge_ids.split(',') if j.strip()]

        valid_judges = User.objects.filter(id__in=judge_ids, profile__is_judge=True)
        event.judges.set(valid_judges)
        serializer = UserSerializer(event.judges.all(), many=True, context={'request': request})
        return Response({
            "count": event.judges.count(),
            "judges": serializer.data
        })

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsNotBanned])
    def live(self, request):
        now = timezone.now()
        events = Event.objects.filter(start_date__lte=now, end_date__gte=now).order_by('start_date')
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

# ========== TEAM VIEWS ==========
class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by('-created_at')
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Team.objects.all().order_by('-created_at').prefetch_related('members')
        q = (self.request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q) |
                Q(enrollments__event__name__icontains=q)
            )
        mine = (self.request.query_params.get('mine') or '').strip().lower()
        if mine in ['1', 'true', 'yes']:
            qs = qs.filter(Q(leader=self.request.user) | Q(members=self.request.user)).distinct()
        event_id = (self.request.query_params.get('event') or '').strip()
        if event_id:
            qs = qs.filter(enrollments__event_id=event_id, enrollments__status=TeamEvent.STATUS_ENROLLED)
        filt = (self.request.query_params.get('filter') or '').strip().lower()
        if filt in ['open', 'full']:
            qs = qs.annotate(member_count=Count('members'))
            if filt == 'open':
                qs = qs.filter(member_count__lt=F('max_members'))
            else:
                qs = qs.filter(member_count__gte=F('max_members'))
        return qs

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = Team.objects.annotate(member_count=Count('members'))
        event_id = (request.query_params.get('event') or '').strip()
        if event_id:
            qs = qs.filter(enrollments__event_id=event_id, enrollments__status=TeamEvent.STATUS_ENROLLED)
        total = qs.count()
        open_count = qs.filter(member_count__lt=F('max_members')).count()
        full_count = qs.filter(member_count__gte=F('max_members')).count()
        my_count = 0
        if request.user and request.user.is_authenticated:
            my_qs = Team.objects.filter(
                Q(leader=request.user) | Q(members=request.user)
            )
            if event_id:
                my_qs = my_qs.filter(enrollments__event_id=event_id, enrollments__status=TeamEvent.STATUS_ENROLLED)
            my_count = my_qs.distinct().count()
        return Response({
            "total": total,
            "open": open_count,
            "full": full_count,
            "mine": my_count
        })
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsNotBanned()]

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


# ========== TEAM EVENT VIEWS ==========
class TeamEventViewSet(viewsets.ModelViewSet):
    queryset = TeamEvent.objects.all().order_by('-enrolled_at')
    serializer_class = TeamEventSerializer
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]

    def get_queryset(self):
        qs = TeamEvent.objects.all().order_by('-enrolled_at').select_related('team', 'event')
        event_id = (self.request.query_params.get('event') or '').strip()
        if event_id:
            qs = qs.filter(event_id=event_id)
        team_id = (self.request.query_params.get('team') or '').strip()
        if team_id:
            qs = qs.filter(team_id=team_id)
        status_filter = (self.request.query_params.get('status') or '').strip().lower()
        if status_filter:
            qs = qs.filter(status=status_filter)
        mine = (self.request.query_params.get('mine') or '').strip().lower()
        if mine in ['1', 'true', 'yes']:
            qs = qs.filter(Q(team__leader=self.request.user) | Q(team__members=self.request.user)).distinct()
        return qs

# ========== SUBMISSION VIEWS ==========
class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-created_at')
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'stats']:
            return [AllowAny()]
        return [IsAuthenticated(), IsNotBanned()]

    def get_queryset(self):
        qs = Submission.objects.all().order_by('-created_at').select_related('team_event', 'team_event__event', 'team_event__team')
        q = (self.request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(team_event__team__name__icontains=q) |
                Q(team_event__event__name__icontains=q)
            )
        event_id = (self.request.query_params.get('event') or '').strip()
        if event_id:
            qs = qs.filter(team_event__event_id=event_id)
        filt = (self.request.query_params.get('filter') or '').strip().lower()
        if filt == 'pending':
            qs = qs.filter(is_reviewed=False)
        elif filt == 'reviewed':
            qs = qs.filter(is_reviewed=True, is_winner=False)
        elif filt == 'winning':
            qs = qs.filter(is_winner=True)
        ordering = (self.request.query_params.get('ordering') or '').strip()
        if ordering in ['score', '-score', 'created_at', '-created_at']:
            qs = qs.order_by(ordering)
        # Public results only after event finishes
        if not (self.request.user and self.request.user.is_authenticated):
            now = timezone.now()
            qs = qs.filter(
                Q(team_event__event__judging_end__lte=now) |
                (Q(team_event__event__judging_end__isnull=True) & Q(team_event__event__end_date__lte=now - timedelta(hours=48)))
            )
        return qs

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = Submission.objects.all()
        event_id = (request.query_params.get('event') or '').strip()
        if event_id:
            qs = qs.filter(team_event__event_id=event_id)
        if not (request.user and request.user.is_authenticated):
            now = timezone.now()
            qs = qs.filter(
                Q(team_event__event__judging_end__lte=now) |
                (Q(team_event__event__judging_end__isnull=True) & Q(team_event__event__end_date__lte=now - timedelta(hours=48)))
            )
        total = qs.count()
        pending = qs.filter(is_reviewed=False).count()
        reviewed = qs.filter(is_reviewed=True, is_winner=False).count()
        winners = qs.filter(is_winner=True).count()
        return Response({
            "total": total,
            "pending": pending,
            "reviewed": reviewed,
            "winners": winners
        })
    def perform_create(self, serializer):
        user = self.request.user
        if is_judge(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Judges cannot submit projects.")
        team_event = serializer.validated_data.get('team_event')
        event = team_event.event if team_event else None
        if team_event and team_event.status != TeamEvent.STATUS_ENROLLED:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Team is not enrolled in this event.")
        if event and not event.can_submit():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Submission window is closed for this event.")
        submission = serializer.save(submitted_by=user)
        if event and event.submission_deadline and timezone.now() > event.submission_deadline:
            submission.is_locked_after_deadline = True
            submission.locked_at = timezone.now()
            submission.save(update_fields=["is_locked_after_deadline", "locked_at"])
        
        from .utils.activity_helpers import create_submission_activity
        create_submission_activity(user, submission)
        try:
            if submission.team_event and submission.team_event.team:
                _notify_users(
                    submission.team_event.team.members.all(),
                    "submission_confirmed",
                    "Submission confirmed",
                    body=f'"{submission.title}" has been submitted.',
                    link=f"/submissions/{submission.id}"
                )
        except Exception:
            pass
        try:
            if event:
                _auto_assign_for_submission(event, submission)
        except Exception:
            pass

    def update(self, request, *args, **kwargs):
        submission = self.get_object()
        event = submission.team_event.event if submission.team_event else None
        if submission.is_locked_after_deadline:
            return Response({"error": "Submission is locked after deadline."}, status=status.HTTP_403_FORBIDDEN)
        if event and not event.can_submit():
            return Response({"error": "Submission window is closed for this event."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        submission = self.get_object()
        event = submission.team_event.event if submission.team_event else None
        if submission.is_locked_after_deadline:
            return Response({"error": "Submission is locked after deadline."}, status=status.HTTP_403_FORBIDDEN)
        if event and not event.can_submit():
            return Response({"error": "Submission window is closed for this event."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

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
            event = submission.team_event.event if submission.team_event else None
            if not event or event.judges.count() == 0:
                return Response(
                    {"error": "No judges assigned to this event yet."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if event and not event.can_judge():
                return Response(
                    {"error": "Judging is not open for this event."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if submission.score_locked_by_system:
                return Response(
                    {"error": "Scoring is locked for this submission."},
                    status=status.HTTP_403_FORBIDDEN
                )
            is_assigned_judge = False
            if event and request.user.is_authenticated:
                if submission.judge_assignments.filter(judge_id=request.user.id, is_active=True).exists():
                    is_assigned_judge = True
                else:
                    is_assigned_judge = event.judges.filter(id=request.user.id).exists()

            if not (
                request.user.is_staff or request.user.is_superuser or
                (is_judge(request.user) and is_assigned_judge)
            ):
                return Response(
                    {"error": "Only assigned judges or admins can submit feedback."},
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

            # Criteria-based scoring support
            rubric = event.judging_criteria if event and event.judging_criteria else [
                {"key": "innovation", "label": "Innovation", "weight": 1},
                {"key": "execution", "label": "Execution", "weight": 1},
                {"key": "design", "label": "Design", "weight": 1},
                {"key": "impact", "label": "Impact", "weight": 1},
            ]

            criteria_scores = data.get("criteria_scores", None)
            if isinstance(criteria_scores, str):
                try:
                    criteria_scores = json.loads(criteria_scores)
                except Exception:
                    criteria_scores = None

            if criteria_scores is not None:
                if not isinstance(criteria_scores, dict):
                    return Response(
                        {"error": "criteria_scores must be an object of {key: score}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                missing_keys = []
                total_weight = 0
                total_score = 0
                for c in rubric:
                    key = c.get("key")
                    weight = c.get("weight") or 1
                    if key not in criteria_scores:
                        missing_keys.append(key)
                        continue
                    try:
                        score_val = float(criteria_scores.get(key))
                    except Exception:
                        return Response(
                            {"error": f"Invalid score for '{key}'."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if score_val < 1 or score_val > 10:
                        return Response(
                            {"error": f"Score for '{key}' must be between 1 and 10."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    total_weight += weight
                    total_score += score_val * weight

                if missing_keys:
                    return Response(
                        {"error": f"Missing scores for: {', '.join(missing_keys)}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                computed = total_score / total_weight if total_weight else 0
                data["score"] = round(computed, 2)
                data["criteria_scores"] = criteria_scores
                data["criteria_snapshot"] = rubric
            elif "score" not in data:
                return Response(
                    {"error": "Provide criteria_scores or score."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if existing:
                serializer = JudgeFeedbackSerializer(existing, data=data, partial=True, context={'request': request})
            else:
                serializer = JudgeFeedbackSerializer(data=data, context={'request': request})

            if serializer.is_valid():
                feedback = serializer.save(judge=request.user, submission=submission)
                submission.update_score()
                
                from .utils.activity_helpers import create_feedback_activity
                if submission.team_event and submission.team_event.team:
                    for member in submission.team_event.team.members.all():
                        create_feedback_activity(member, feedback)
                try:
                    if submission.team_event and submission.team_event.team:
                        _notify_users(
                            submission.team_event.team.members.all(),
                            "feedback_received",
                            "New judge feedback",
                            body=f'New feedback on "{submission.title}".',
                            link=f"/submissions/{submission.id}"
                        )
                except Exception:
                    pass
                
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
        return Response(
            {"error": "Winners are auto-announced based on scoring. Organizer action is not required."},
            status=status.HTTP_403_FORBIDDEN
        )

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
            submission__team_event__team__members=user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        submission = serializer.validated_data.get('submission')
        event = submission.team_event.event if submission and submission.team_event else None
        if not event or event.judges.count() == 0:
            raise PermissionDenied("No judges assigned to this event yet.")
        if event and not event.can_judge():
            raise PermissionDenied("Judging is not open for this event.")
        if submission and submission.score_locked_by_system:
            raise PermissionDenied("Scoring is locked for this submission.")
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            is_assigned = False
            if submission and submission.judge_assignments.filter(judge_id=self.request.user.id, is_active=True).exists():
                is_assigned = True
            elif event and event.judges.filter(id=self.request.user.id).exists():
                is_assigned = True
            if not is_assigned:
                raise PermissionDenied("Only assigned judges can submit feedback.")
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


# ========== EVENT RESOURCES / SPONSORS / AWARDS ==========
class EventResourceViewSet(viewsets.ModelViewSet):
    queryset = EventResource.objects.all().order_by('-created_at')
    serializer_class = EventResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]

class EventSponsorViewSet(viewsets.ModelViewSet):
    queryset = EventSponsor.objects.all().order_by('-created_at')
    serializer_class = EventSponsorSerializer
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get_permissions(self):
        return [IsAuthenticated(), IsNotBanned()]

    def get_queryset(self):
        qs = EventSponsor.objects.all().order_by('-created_at')
        event_id = self.request.query_params.get("event")
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    def _ensure_event_owner(self, event):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return
        if not event or event.organizer_id != user.id:
            raise PermissionDenied("Only the event organizer can manage sponsors.")

    def perform_create(self, serializer):
        event = serializer.validated_data.get("event")
        self._ensure_event_owner(event)
        serializer.save()

    def perform_update(self, serializer):
        event = serializer.instance.event
        self._ensure_event_owner(event)
        serializer.save()

    def perform_destroy(self, instance):
        event = instance.event
        self._ensure_event_owner(event)
        instance.delete()

class AwardCategoryViewSet(viewsets.ModelViewSet):
    queryset = AwardCategory.objects.all().order_by('-created_at')
    serializer_class = AwardCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]

class AwardResultViewSet(viewsets.ModelViewSet):
    queryset = AwardResult.objects.all().order_by('-created_at')
    serializer_class = AwardResultSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]

    def get_queryset(self):
        qs = AwardResult.objects.all().order_by('-created_at')
        if not (self.request.user and self.request.user.is_authenticated):
            now = timezone.now()
            qs = qs.filter(
                Q(event__judging_end__lte=now) |
                (Q(event__judging_end__isnull=True) & Q(event__end_date__lte=now - timedelta(hours=48)))
            )
        return qs

class JudgeAssignmentViewSet(viewsets.ModelViewSet):
    queryset = JudgeAssignment.objects.all().order_by('-assigned_at')
    serializer_class = JudgeAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]


# ========== NOTIFICATIONS ==========
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=["post"])
    def read(self, request):
        ids = request.data.get("ids")
        if ids is None:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        else:
            Notification.objects.filter(user=request.user, id__in=ids).update(is_read=True)
        return Response({"status": "ok"})

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsOrganizerOrAdmin(), IsNotBanned()]


# ========== MEDIA ASSETS ==========
class MediaAssetViewSet(viewsets.ModelViewSet):
    queryset = MediaAsset.objects.all().order_by('-created_at')
    serializer_class = MediaAssetSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsNotBanned()]
        return [IsAuthenticated(), IsNotBanned()]


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
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count})


class UploadSign(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def post(self, request):
        return Response(
            {"error": "Upload signing not configured."},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


def _build_daily_series(qs, date_field, days=30):
    today = timezone.now().date()
    start = today - timedelta(days=days - 1)
    data = (
        qs.filter(**{f"{date_field}__date__gte": start})
        .annotate(day=TruncDate(date_field))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    counts = {item['day']: item['count'] for item in data}
    series = []
    for i in range(days):
        day = start + timedelta(days=i)
        series.append({
            'date': day.isoformat(),
            'count': counts.get(day, 0)
        })
    return series


def _build_overview_analytics(user=None):
    now = timezone.now()
    events_qs = Event.objects.all()
    teams_qs = Team.objects.all()
    submissions_qs = Submission.objects.all()
    users_qs = User.objects.all()
    judges_qs = User.objects.filter(profile__is_judge=True)

    live_events = events_qs.filter(start_date__lte=now, end_date__gte=now).count()
    upcoming_events = events_qs.filter(start_date__gt=now).count()
    reviewed_count = submissions_qs.filter(is_reviewed=True).count()
    activity_qs = Activity.objects.none()
    if user and user.is_authenticated:
        activity_qs = Activity.objects.filter(user=user)

    # Deadline timeline + next deadline (across all events)
    deadline_timeline = []
    stage_stats = {k: {"events": 0, "teams": 0, "submissions": 0} for k, _ in Event.STATUS_CHOICES}

    for ev in events_qs:
        status = ev.get_status(now=now)
        if status in stage_stats:
            stage_stats[status]["events"] += 1
            stage_stats[status]["teams"] += TeamEvent.objects.filter(
                event=ev, status=TeamEvent.STATUS_ENROLLED
            ).count()
            stage_stats[status]["submissions"] += Submission.objects.filter(
                team_event__event=ev
            ).count()

        # Build deadline timeline items
        deadline_items = [
            ("registration_deadline", "Registration Deadline", ev.registration_deadline or ev.start_date, ev.registration_deadline is None),
            ("team_deadline", "Team Registration Deadline", ev.team_deadline, False),
            ("submission_open_at", "Submission Opens", ev._effective_submission_open_at(), ev.submission_open_at is None),
            ("submission_deadline", "Submission Deadline", ev._effective_submission_deadline(), ev.submission_deadline is None),
            ("judging_start", "Judging Starts", ev._effective_judging_start(), ev.judging_start is None),
            ("judging_end", "Judging Ends", ev._effective_judging_end(), ev.judging_end is None),
        ]
        for key, label, at, is_default in deadline_items:
            if not at:
                continue
            if at > now:
                deadline_timeline.append({
                    "event_id": ev.id,
                    "event_name": ev.name,
                    "deadline_type": key,
                    "label": label,
                    "at": at.isoformat() if hasattr(at, "isoformat") else at,
                    "is_default": bool(is_default),
                })

    deadline_timeline.sort(key=lambda d: d["at"])
    next_deadline = deadline_timeline[0] if deadline_timeline else None

    # Judge load distribution
    judge_load = []
    for j in judges_qs:
        assigned = JudgeAssignment.objects.filter(judge=j, is_active=True).count()
        completed = JudgeFeedback.objects.filter(judge=j).count()
        if assigned or completed:
            judge_load.append({
                "id": j.id,
                "username": j.username,
                "assigned": assigned,
                "completed": completed,
            })
    judge_load.sort(key=lambda x: (-x["assigned"], -x["completed"]))
    judge_load = judge_load[:8]

    # Moderation queue (recent moderation actions)
    moderation_queue = list(
        ModerationAction.objects.order_by("-created_at")[:8].values(
            "id", "action_type", "reason", "created_at",
            "moderator_id", "target_user_id"
        )
    )

    # Resource + sponsor totals
    resource_count = EventResource.objects.count()
    sponsor_count = EventSponsor.objects.count()

    # Event winners (overall) for finished events
    event_winners = []
    results = AwardResult.objects.filter(category__isnull=True).select_related(
        "event", "submission__team_event__team"
    )
    for r in results:
        ev = r.event
        if not ev or ev.get_status(now=now) != Event.STATUS_FINISHED:
            continue
        team = None
        if r.submission and r.submission.team_event:
            team = r.submission.team_event.team
        event_winners.append({
            "id": r.id,
            "event_id": ev.id,
            "event_name": ev.name,
            "team_name": team.name if team else None,
            "score": r.score,
            "rank": r.place,
            "members_count": team.members.count() if team else 0,
            "announced_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {
        'stats': {
            'events_total': events_qs.count(),
            'events_live': live_events,
            'events_upcoming': upcoming_events,
            'teams_total': teams_qs.count(),
            'submissions_total': submissions_qs.count(),
            'users_total': users_qs.count(),
            'judges_total': judges_qs.count(),
            'reviewed_total': reviewed_count,
            'review_rate': (reviewed_count / submissions_qs.count()) if submissions_qs.exists() else 0,
            'resource_total': resource_count,
            'sponsor_total': sponsor_count,
        },
        'series': {
            'submissions': _build_daily_series(submissions_qs, 'created_at'),
            'users': _build_daily_series(users_qs, 'date_joined'),
            'reviews': _build_daily_series(JudgeFeedback.objects.all(), 'created_at'),
        },
        'recent_activity': ActivitySerializer(activity_qs.order_by('-created_at')[:8], many=True).data,
        'recent_events': EventSerializer(events_qs.order_by('-start_date')[:5], many=True).data,
        'top_teams': list(
            Team.objects.annotate(
                submissions_count=Count('enrollments__submissions', distinct=True),
                members_count=Count('members', distinct=True)
            ).order_by('-submissions_count', '-members_count')[:6].values(
                'id', 'name', 'submissions_count', 'members_count'
            )
        ),
        'event_winners': event_winners,
        'deadline_timeline': deadline_timeline[:10],
        'next_deadline': next_deadline["at"] if next_deadline else None,
        'deadline_type': next_deadline["deadline_type"] if next_deadline else None,
        'deadline_event': {
            "id": next_deadline["event_id"],
            "name": next_deadline["event_name"],
        } if next_deadline else None,
        'stage_stats': stage_stats,
        'judge_load': judge_load,
        'moderation_queue': moderation_queue,
        'updated_at': now.isoformat()
    }


def _build_judge_analytics(user):
    now = timezone.now()
    base_qs = Submission.objects.filter(
        judge_assignments__judge=user,
        judge_assignments__is_active=True
    ).select_related('team_event', 'team_event__event', 'team_event__team').distinct()
    feedback_qs = JudgeFeedback.objects.filter(judge=user)

    all_subs = list(base_qs)
    judging_subs = []
    assigned_events = {}
    judging_open = False
    next_judging_start = None

    for sub in all_subs:
        event = sub.team_event.event if sub.team_event else None
        if not event:
            continue
        assigned_events[event.id] = event
        status = event.get_status(now=now)
        if status == Event.STATUS_JUDGING:
            judging_subs.append(sub)
            judging_open = True
        else:
            start = event._effective_judging_start()
            if start and start > now:
                if next_judging_start is None or start < next_judging_start:
                    next_judging_start = start

    judging_ids = [s.id for s in judging_subs]
    submissions_qs = Submission.objects.filter(id__in=judging_ids).select_related('team_event', 'team_event__event', 'team_event__team')

    assigned_total = submissions_qs.count()
    my_feedback_count = feedback_qs.count()
    pending_for_judge = submissions_qs.exclude(feedback__judge=user).count()
    completed_for_judge = submissions_qs.filter(feedback__judge=user).count()
    events_assigned = len(assigned_events)

    # Score distribution buckets
    buckets = [
        {'label': '0-2', 'min': 0, 'max': 2},
        {'label': '2-4', 'min': 2, 'max': 4},
        {'label': '4-6', 'min': 4, 'max': 6},
        {'label': '6-8', 'min': 6, 'max': 8},
        {'label': '8-10', 'min': 8, 'max': 10.1},
    ]
    dist = []
    for b in buckets:
        count = feedback_qs.filter(score__gte=b['min'], score__lt=b['max']).count()
        dist.append({'label': b['label'], 'count': count})

    assigned_queue = []
    for sub in sorted(judging_subs, key=lambda s: s.created_at, reverse=True)[:12]:
        my_fb = sub.feedback.filter(judge=user).first()
        assigned_judges = sub.judge_assignments.filter(is_active=True).values_list("judge_id", flat=True)
        assigned_queue.append({
            'id': sub.id,
            'title': sub.title,
            'team_name': sub.team_event.team.name if sub.team_event and sub.team_event.team else None,
            'event_name': sub.team_event.event.name if sub.team_event and sub.team_event.event else None,
            'created_at': sub.created_at.isoformat(),
            'is_reviewed': sub.is_reviewed,
            'my_score': my_fb.score if my_fb else None,
            'required_judges_count': sub.team_event.event.reviewers_per_submission if sub.team_event and sub.team_event.event else 0,
            'completed_judges_count': sub.feedback.filter(judge_id__in=assigned_judges).count() if assigned_judges else 0,
        })

    return {
        'stats': {
            'assigned_total': assigned_total,
            'pending_for_judge': pending_for_judge,
            'completed_for_judge': completed_for_judge,
            'events_assigned': events_assigned,
            'my_feedbacks': my_feedback_count
        },
        'series': {
            'my_scores': _build_daily_series(feedback_qs, 'created_at'),
            'assigned': _build_daily_series(submissions_qs, 'created_at')
        },
        'score_distribution': dist,
        'assigned_queue': assigned_queue,
        'judging_open': judging_open,
        'next_judging_start': next_judging_start.isoformat() if next_judging_start else None,
        'updated_at': now.isoformat()
    }

def _compute_event_winners(event, top_n=3):
    if not event:
        return {"status": "no_event"}
    now = timezone.now()
    if now < event._effective_judging_end():
        return {"status": "judging_not_finished"}

    submissions_qs = Submission.objects.filter(team_event__event=event)
    if not submissions_qs.exists():
        return {"status": "no_submissions"}

    if submissions_qs.filter(is_reviewed=False).exists():
        return {"status": "pending_reviews"}

    AwardResult.objects.filter(event=event).delete()
    submissions_qs.update(is_winner=False, winner_place=None, winner_prize=None)

    ranked = list(submissions_qs.order_by('-score', 'created_at'))
    winners = []
    places = ['1st', '2nd', '3rd', 'honorable_mention']
    top_n = max(1, int(top_n or 3))
    for idx, sub in enumerate(ranked[:top_n]):
        place = places[idx] if idx < len(places) else None
        sub.is_winner = True
        sub.winner_place = place
        if sub.winner_prize is None:
            sub.winner_prize = ''
        sub.save(update_fields=['is_winner', 'winner_place', 'winner_prize'])
        AwardResult.objects.create(
            event=event,
            submission=sub,
            category=None,
            place=idx + 1,
            score=sub.score
        )
        winners.append(sub.id)

    # Category winners (top score per category)
    categories = AwardCategory.objects.filter(event=event)
    for cat in categories:
        top = ranked[0] if ranked else None
        if not top:
            continue
        AwardResult.objects.create(
            event=event,
            submission=top,
            category=cat,
            place=1,
            score=top.score
        )

    try:
        participants = _get_event_participants(event)
        _notify_users(
            participants,
            "results_announced",
            "Results announced",
            body=f"Results for {event.name} are now available.",
            link=f"/events/{event.id}"
        )
    except Exception:
        pass

    return {"status": "ok", "overall_winners": winners, "categories": categories.count()}

def _auto_assign_for_submission(event, submission):
    try:
        judges = list(event.judges.all())
        if not judges:
            return 0
        target = event.reviewers_per_submission or 0
        if target <= 0:
            return 0
        existing = set(submission.judge_assignments.filter(is_active=True).values_list("judge_id", flat=True))
        needed = max(0, target - len(existing))
        if needed == 0:
            return 0
        loads = {j.id: JudgeAssignment.objects.filter(event=event, judge=j, is_active=True).count() for j in judges}
        eligible = [j for j in judges if j.id not in existing]
        eligible.sort(key=lambda j: loads.get(j.id, 0))
        created = 0
        for j in eligible[:needed]:
            JudgeAssignment.objects.get_or_create(
                event=event,
                submission=submission,
                judge=j,
                defaults={"is_active": True}
            )
            created += 1
        return created
    except Exception:
        return 0


class AnalyticsOverview(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request):
        return Response(_build_overview_analytics(request.user))


class AnalyticsJudge(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request):
        if not is_judge(request.user):
            return Response({"error": "Only judges can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        return Response(_build_judge_analytics(request.user))


class AnalyticsStream(APIView):
    permission_classes = [IsAuthenticated, IsNotBanned]

    def get(self, request):
        channel = request.query_params.get('channel', 'overview')
        if channel not in ['overview', 'judge']:
            return Response({"error": "Invalid channel."}, status=status.HTTP_400_BAD_REQUEST)
        if channel == 'judge' and not is_judge(request.user):
            return Response({"error": "Only judges can access this channel."}, status=status.HTTP_403_FORBIDDEN)

        def event_stream():
            try:
                while True:
                    if channel == 'overview':
                        payload = _build_overview_analytics(request.user)
                    else:
                        payload = _build_judge_analytics(request.user)
                    yield f"data: {json.dumps(payload, cls=DjangoJSONEncoder)}\n\n"
                    time.sleep(5)
            except GeneratorExit:
                return

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

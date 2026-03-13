from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Event, Team, Submission, JudgeFeedback, UserProfile, Activity
from .serializers import (
    PostSerializer, EventSerializer, TeamSerializer,
    SubmissionSerializer, JudgeFeedbackSerializer,
    UserSerializer, RegisterSerializer, ActivitySerializer
)
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.permissions import BasePermission
from rest_framework import filters
from rest_framework.pagination import PageNumberPagination

User = get_user_model()

# ========== HELPERS ==========
def is_judge(user):
    return hasattr(user, 'profile') and user.profile.is_judge

def is_organizer(user):
    return user.is_staff or user.is_superuser or (hasattr(user, 'profile') and user.profile.is_organizer)

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
        return is_organizer(request.user)

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

    def get_permissions(self):
        if self.action == 'me':
            return [IsAuthenticated()]
        if self.action in ['make_judge', 'remove_judge', 'list', 'retrieve', 'activities', 'change_password', 'verify_password', 'delete_account']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def activities(self, request):
        """Get all activities for the logged-in user"""
        try:
            activities = Activity.objects.filter(user=request.user).order_by('-created_at')[:50]
            serializer = ActivitySerializer(activities, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching activities: {e}")
            return Response([])

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(request.user, data=request.data, partial=request.method == 'PATCH')
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

        return Response({"success": f"{target_user.username} is now a judge.", "user": UserSerializer(target_user).data})

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

        return Response({"success": f"Judge role removed from {target_user.username}.", "user": UserSerializer(target_user).data})
    
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
        
        # Check if user has teams
        if user.teams.exists():
            return Response(
                {"error": "Cannot delete account while still in teams. Leave all teams first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has submissions
        if user.submissions_made.exists():
            return Response(
                {"error": "Cannot delete account with existing submissions."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete the user
        user.delete()
        return Response({"success": "Account deleted successfully"}, status=status.HTTP_200_OK)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# ========== POST VIEWS ==========
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    pagination_class = PostPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

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
        serializer = TeamSerializer(event.teams.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        event = self.get_object()
        teams = event.teams.all()
        submissions = Submission.objects.filter(team__in=teams)
        serializer = SubmissionSerializer(submissions, many=True)
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
        serializer = UserSerializer(team.members.all(), many=True)
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
            serializer = JudgeFeedbackSerializer(feedbacks, many=True)
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
                serializer = JudgeFeedbackSerializer(existing, data=data, partial=True)
            else:
                serializer = JudgeFeedbackSerializer(data=data)

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
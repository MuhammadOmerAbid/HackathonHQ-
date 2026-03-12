from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Event, Team, Submission, JudgeFeedback, UserProfile
from .serializers import (
    PostSerializer, EventSerializer, TeamSerializer,
    SubmissionSerializer, JudgeFeedbackSerializer,
    UserSerializer, RegisterSerializer
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
        if self.action in ['make_judge', 'remove_judge', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

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

        # Cannot make yourself a judge
        if target_user == request.user:
            return Response({"error": "You cannot make yourself a judge."}, status=status.HTTP_400_BAD_REQUEST)

        # Cannot make a judge if they're on any team
        if target_user.teams.exists():
            return Response({"error": f"{target_user.username} is on a team. Remove them from all teams first."}, status=status.HTTP_400_BAD_REQUEST)

        # Cannot make a judge if they have submissions
        if target_user.submissions_made.exists():
            return Response({"error": f"{target_user.username} has existing submissions. Cannot make a participant a judge."}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        profile.is_judge = True
        profile.save()

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

        return Response({"success": f"Judge role removed from {target_user.username}.", "user": UserSerializer(target_user).data})

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
        # Judges cannot join teams
        if is_judge(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Judges cannot create or join teams.")
        team = serializer.save()
        team.members.add(user)
        if hasattr(team, 'leader'):
            team.leader = user
            team.save()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        team = self.get_object()

        # Judges cannot join teams
        if is_judge(request.user):
            return Response({"message": "Judges cannot join teams."}, status=status.HTTP_403_FORBIDDEN)

        if team.members.filter(id=request.user.id).exists():
            return Response({"message": "You are already a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

        max_members = getattr(team, 'max_members', 4)
        if team.members.count() >= max_members:
            return Response({"message": "This team is full."}, status=status.HTTP_400_BAD_REQUEST)

        team.members.add(request.user)
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
        # Judges cannot submit
        if is_judge(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Judges cannot submit projects.")
        serializer.save(submitted_by=user)

    @action(detail=True, methods=["get", "post", "put", "delete"])
    def feedback(self, request, pk=None):
        submission = self.get_object()

        # GET - any authenticated user can view feedback (transparency)
        if request.method == "GET":
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Everyone can view feedback
            feedbacks = submission.feedback.all().order_by('-created_at')
            serializer = JudgeFeedbackSerializer(feedbacks, many=True)
            return Response(serializer.data)

        # POST/PUT - only judges, organizers, and admins can submit/edit feedback
        elif request.method in ["POST", "PUT"]:
            if not (is_judge(request.user) or is_organizer(request.user) or request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "Only judges, organizers, and admins can submit feedback."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if already submitted feedback — update instead
            existing = submission.feedback.filter(judge=request.user).first()
            
            if existing and request.method == "POST":
                return Response(
                    {"error": "You already submitted feedback. Use PUT to update."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Make sure submission ID is in the data if needed
            data = request.data.copy()
            if 'submission' not in data:
                data['submission'] = submission.id
            
            if existing:
                serializer = JudgeFeedbackSerializer(existing, data=data, partial=True)
            else:
                serializer = JudgeFeedbackSerializer(data=data)

            if serializer.is_valid():
                serializer.save(judge=request.user, submission=submission)
                # Auto-update submission score and is_reviewed
                submission.update_score()
                return Response(serializer.data, status=status.HTTP_200_OK if existing else status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # DELETE - only the judge who wrote it, organizers, or admins can delete
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
            
            # Allow if: user is the judge who wrote it, OR user is organizer, OR user is admin/staff
            if not (feedback.judge == request.user or is_organizer(request.user) or request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "You don't have permission to delete this feedback."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            feedback.delete()
            submission.update_score()  # Recalculate score after deletion
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path='mark-winner')
    def mark_winner(self, request, pk=None):
        """Mark a submission as a winner. Organizers/admins only."""
        if not is_organizer(request.user):
            return Response({"error": "Only organizers can mark winners."}, status=status.HTTP_403_FORBIDDEN)

        submission = self.get_object()
        submission.is_winner = request.data.get('is_winner', True)
        submission.is_reviewed = True
        submission.winner_place = request.data.get('winner_place', '')
        submission.winner_prize = request.data.get('winner_prize', '')
        submission.save()
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
        # Judges and organizers/admins can see all feedback
        if is_judge(user) or is_organizer(user):
            return JudgeFeedback.objects.all().order_by('-created_at')
        # Regular users only see feedback on their own team's submissions
        return JudgeFeedback.objects.filter(
            submission__team__members=user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(judge=self.request.user)

    def update(self, request, *args, **kwargs):
        feedback = self.get_object()
        # Only the judge who wrote it (or admin) can edit
        if feedback.judge != request.user and not request.user.is_staff:
            return Response({"error": "You can only edit your own feedback."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        feedback = self.get_object()
        if feedback.judge != request.user and not request.user.is_staff:
            return Response({"error": "You can only delete your own feedback."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
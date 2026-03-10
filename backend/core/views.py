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
from django.contrib.auth.models import User

User = get_user_model()

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
        return (
            request.user.is_staff or
            request.user.is_superuser or
            (hasattr(request.user, 'profile') and request.user.profile.is_organizer)
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_staff or
            request.user.is_superuser or
            obj.organizer == request.user
        )

# ========== PAGINATION ==========
class PostPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 20

# ========== USER VIEWS ==========
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer

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
        # Allow unauthenticated users to list/retrieve teams
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Save the team, then set creator as leader and add as member
        team = serializer.save()
        team.members.add(self.request.user)
        # If your Team model has a `leader` field, set it here:
        if hasattr(team, 'leader'):
            team.leader = self.request.user
            team.save()

    # ── FIX 1: join action ──────────────────────────────────────────
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        """Let the authenticated user join this team."""
        team = self.get_object()

        # Already a member?
        if team.members.filter(id=request.user.id).exists():
            return Response(
                {"message": "You are already a member of this team."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Team full?
        max_members = getattr(team, 'max_members', 4)
        if team.members.count() >= max_members:
            return Response(
                {"message": "This team is full."},
                status=status.HTTP_400_BAD_REQUEST
            )

        team.members.add(request.user)
        serializer = self.get_serializer(team)
        return Response(serializer.data)

    # ── FIX 2: leave action ─────────────────────────────────────────
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        """Let the authenticated user leave this team."""
        team = self.get_object()

        # Not a member?
        if not team.members.filter(id=request.user.id).exists():
            return Response(
                {"message": "You are not a member of this team."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Leader can't leave (they must delete instead)
        if hasattr(team, 'leader') and team.leader == request.user:
            return Response(
                {"message": "You are the team leader. Delete the team or transfer leadership instead."},
                status=status.HTTP_400_BAD_REQUEST
            )

        team.members.remove(request.user)
        serializer = self.get_serializer(team)
        return Response(serializer.data)

    # ── Existing helper actions (kept as-is) ────────────────────────
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
        serializer.save()

    @action(detail=True, methods=["get"])
    def feedback(self, request, pk=None):
        submission = self.get_object()
        feedback = submission.feedback.all()
        serializer = JudgeFeedbackSerializer(feedback, many=True)
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

    def perform_create(self, serializer):
        serializer.save(judge=self.request.user)
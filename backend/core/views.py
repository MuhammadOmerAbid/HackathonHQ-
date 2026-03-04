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
    """Allow only the owner to edit/delete"""
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsOrganizerOrAdmin(BasePermission):
    """
    Custom permission to only allow organizers and admins to create/edit events.
    """
    def has_permission(self, request, view):
        # Allow anyone to view events (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For creating events, check if user is authenticated and has organizer rights
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Check if user is staff, superuser, or has organizer profile
        return (
            request.user.is_staff or 
            request.user.is_superuser or 
            (hasattr(request.user, 'profile') and request.user.profile.is_organizer)
        )
    
    def has_object_permission(self, request, view, obj):
        # Allow anyone to view events
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For editing/deleting, only allow organizer or admin
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
        """Get the current authenticated user"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(request.user, data=request.data, partial=request.method=='PATCH')
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

# ========== EVENT VIEWS (UPDATED WITH ORGANIZER PERMISSION) ==========
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-start_date')
    serializer_class = EventSerializer
    permission_classes = [IsOrganizerOrAdmin]  # Changed from IsAuthenticated to custom permission

    def perform_create(self, serializer):
        # Automatically set the organizer to the current user
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=["get"])
    def teams(self, request, pk=None):
        """Get all teams for this event"""
        event = self.get_object()
        serializer = TeamSerializer(event.teams.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        """Get all submissions for this event"""
        event = self.get_object()
        # Get all teams for this event, then get their submissions
        teams = event.teams.all()
        submissions = Submission.objects.filter(team__in=teams)
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)

# ========== TEAM VIEWS ==========
class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # When creating a team, add the creator as a member and leader
        team = serializer.save()
        team.members.add(self.request.user)
        # You might want to add a leader field to Team model

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        """Add a member to the team"""
        team = self.get_object()
        user_id = request.data.get("user_id")
        
        # Check if the requesting user is the team leader (you'd need a leader field)
        # For now, just add the member
        try:
            user = User.objects.get(id=user_id)
            team.members.add(user)
            return Response({"status": "member added", "user": user.username})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        """Remove a member from the team"""
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
        """Get all members of the team"""
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
        """Get all feedback for this submission"""
        submission = self.get_object()
        feedback = submission.feedback.all()
        serializer = JudgeFeedbackSerializer(feedback, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_score(self, request, pk=None):
        """Add or update score for submission"""
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
        # Automatically set the judge to the current user
        serializer.save(judge=self.request.user)
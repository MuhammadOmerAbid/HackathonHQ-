from rest_framework import viewsets, permissions
from .models import Post
from .serializers import PostSerializer
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.permissions import BasePermission
from rest_framework import filters
from rest_framework.pagination import PageNumberPagination


User = get_user_model()

class PostPagination(PageNumberPagination):
    page_size = 5        # number of posts per page
    page_size_query_param = 'page_size'  # optional: allow custom page size in query
    max_page_size = 20

class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Only allow the owner to edit/delete
        return obj.owner == request.user
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')  # order by ID to fix pagination warning
    serializer_class = UserSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = PostPagination             # add pagination
    filter_backends = [filters.SearchFilter]     # add search
    search_fields = ['title', 'content']         # searchable fields

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)  # assign logged-in user as owner
    
#hackathon plateform
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Event, Team, Submission, JudgeFeedback
from .serializers import EventSerializer, TeamSerializer, SubmissionSerializer, JudgeFeedbackSerializer
from django.contrib.auth.models import User

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-start_date')
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["get"])
    def teams(self, request, pk=None):
        event = self.get_object()
        serializer = TeamSerializer(event.teams.all(), many=True)
        return Response(serializer.data)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get("user_id")
        user = User.objects.get(id=user_id)
        team.members.add(user)
        return Response({"status": "member added"})

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class JudgeFeedbackViewSet(viewsets.ModelViewSet):
    queryset = JudgeFeedback.objects.all()
    serializer_class = JudgeFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
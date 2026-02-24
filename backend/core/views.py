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
    

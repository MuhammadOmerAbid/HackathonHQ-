from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RegisterView, PostViewSet
from .views import EventViewSet, TeamViewSet, SubmissionViewSet, JudgeFeedbackViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')  # Added basename
router.register(r'posts', PostViewSet, basename='post')
router.register(r'events', EventViewSet, basename='event')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'feedback', JudgeFeedbackViewSet, basename='feedback')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),  # This will include all router URLs under /api/
]

# Remove the duplicate urlpatterns += router.urls line

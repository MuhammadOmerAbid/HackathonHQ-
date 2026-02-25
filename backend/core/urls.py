from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RegisterView, PostViewSet
from .views import EventViewSet, TeamViewSet, SubmissionViewSet, JudgeFeedbackViewSet



router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'posts', PostViewSet)  # new
router.register(r"events", EventViewSet)
router.register(r"teams", TeamViewSet)
router.register(r"submissions", SubmissionViewSet)
router.register(r"feedback", JudgeFeedbackViewSet)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("api/", include(router.urls)),
]

urlpatterns += router.urls

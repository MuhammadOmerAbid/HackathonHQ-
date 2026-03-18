from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RegisterView, PostViewSet
from .views import EventViewSet, TeamViewSet, SubmissionViewSet, JudgeFeedbackViewSet
from .views import ConversationListCreate, ConversationMessages, MessageUnreadCount, TeamMessages, NotificationsUnreadCount
from .views import AnalyticsOverview, AnalyticsJudge, AnalyticsStream

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')  # Added basename
router.register(r'posts', PostViewSet, basename='post')
router.register(r'events', EventViewSet, basename='event')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'feedback', JudgeFeedbackViewSet, basename='feedback')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('analytics/overview/', AnalyticsOverview.as_view(), name='analytics_overview'),
    path('analytics/judge/', AnalyticsJudge.as_view(), name='analytics_judge'),
    path('analytics/stream/', AnalyticsStream.as_view(), name='analytics_stream'),
    path('messages/conversations/', ConversationListCreate.as_view(), name='message_conversations'),
    path('messages/conversations/<int:pk>/messages/', ConversationMessages.as_view(), name='conversation_messages'),
    path('messages/unread/count/', MessageUnreadCount.as_view(), name='messages_unread_count'),
    path('messages/teams/<int:team_id>/messages/', TeamMessages.as_view(), name='team_messages'),
    path('notifications/unread/count/', NotificationsUnreadCount.as_view(), name='notifications_unread_count'),
    path('', include(router.urls)),  # This will include all router URLs under /api/
]

# Remove the duplicate urlpatterns += router.urls line

from django.contrib import admin
from .models import Post, Event, Team, Submission, JudgeFeedback

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "created_at")

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date", "is_premium", "organizer")
    list_filter = ("is_premium", "start_date")
    search_fields = ("name", "description")

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "leader", "created_at")

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("title", "team_event", "score", "created_at")

@admin.register(JudgeFeedback)
class JudgeFeedbackAdmin(admin.ModelAdmin):
    list_display = ("submission", "judge", "score", "created_at")

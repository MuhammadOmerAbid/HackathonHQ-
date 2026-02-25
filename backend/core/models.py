from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Post(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
#for hackathon plateform
from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_premium = models.BooleanField(default=False)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organized_events")

class Team(models.Model):
    name = models.CharField(max_length=255)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="teams")
    members = models.ManyToManyField(User, related_name="teams")
    created_at = models.DateTimeField(auto_now_add=True)

class Submission(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="submissions")
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to="submissions/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0)

class JudgeFeedback(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="feedback")
    judge = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.FloatField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("submission", "judge")

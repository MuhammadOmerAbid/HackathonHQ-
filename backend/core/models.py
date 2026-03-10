from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User

User = get_user_model()

class Post(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

#for hackathon plateform
class Event(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_premium = models.BooleanField(default=False)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organized_events")
    
    def __str__(self):
        return self.name

# Add this new model for user profiles
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_organizer = models.BooleanField(default=False)
    organization_name = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"

class Team(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)          # ← add
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="teams")
    leader = models.ForeignKey(                                     # ← add
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="led_teams"
    )
    max_members = models.PositiveIntegerField(default=4)            # ← add
    members = models.ManyToManyField(User, related_name="teams", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Submission(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="submissions")
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to="submissions/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0)
    
    def __str__(self):
        return self.title

class JudgeFeedback(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="feedback")
    judge = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.FloatField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("submission", "judge")
    
    def __str__(self):
        return f"Feedback for {self.submission.title} by {self.judge.username}"
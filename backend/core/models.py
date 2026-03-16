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

class Event(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_premium = models.BooleanField(default=False)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organized_events")
    
    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_organizer = models.BooleanField(default=False)
    is_judge = models.BooleanField(default=False)
    organization_name = models.CharField(max_length=200, blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    cover_image = models.ImageField(upload_to='covers/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"
    
    # Add these methods to get counts
    def get_posts_count(self):
        return self.user.posts.count()
    
    def get_followers_count(self):
        return self.user.followers_set.count()
    
    def get_following_count(self):
        return self.user.following_set.count()
    
    
class Follow(models.Model):
    """Model to handle user following relationships"""
    follower = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='following_set'
    )
    followed = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='followers_set'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'followed')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"

class Team(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="teams")
    leader = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="led_teams"
    )
    max_members = models.PositiveIntegerField(default=4)
    members = models.ManyToManyField(User, related_name="teams", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Submission(models.Model):
    WINNER_PLACE_CHOICES = [
        ('1st', '1st Place'),
        ('2nd', '2nd Place'),
        ('3rd', '3rd Place'),
        ('honorable_mention', 'Honorable Mention'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="submissions")
    submitted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="submissions_made"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to="submissions/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0)
    is_reviewed = models.BooleanField(default=False)
    is_winner = models.BooleanField(default=False)
    winner_place = models.CharField(
        max_length=20, blank=True, null=True, choices=WINNER_PLACE_CHOICES
    )
    winner_prize = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.title
    
    def update_score(self):
        """Calculate average score from all feedback"""
        feedbacks = self.feedback.all()
        if feedbacks.exists():
            total = sum(f.score for f in feedbacks)
            self.score = total / feedbacks.count()
            self.is_reviewed = True
        else:
            self.score = 0
            self.is_reviewed = False
        self.save()
        return self.score

class JudgeFeedback(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="feedback")
    judge = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.FloatField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("submission", "judge")
    
    def __str__(self):
        return f"Feedback for {self.submission.title} by {self.judge.username}"

class Activity(models.Model):
    ACTIVITY_TYPES = [
        # Team Activities
        ('team_join', 'Joined Team'),
        ('team_create', 'Created Team'),
        ('team_leave', 'Left Team'),
        
        # Submission Activities
        ('submission', 'Submitted Project'),
        ('feedback', 'Received Feedback'),
        ('winner', 'Won Hackathon'),
        ('review', 'Submission Reviewed'),

        # Event Activities
        ('event_register', 'Registered for Event'),

         # Follow Activities  # ADD THIS SECTION
        ('follow', 'Started Following'),
        ('new_follower', 'New Follower'),
        
        # NEW: Role Change Activities
        ('became_judge', 'Became a Judge'),
        ('became_organizer', 'Became an Organizer'),
        ('role_removed', 'Role Removed'),
        ('password_change', 'Password Changed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_important = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional relations for linking
    team = models.ForeignKey('Team', null=True, blank=True, on_delete=models.SET_NULL)
    submission = models.ForeignKey('Submission', null=True, blank=True, on_delete=models.SET_NULL)
    event = models.ForeignKey('Event', null=True, blank=True, on_delete=models.SET_NULL)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_type_display()} - {self.created_at}"
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def default_judging_criteria():
    return [
        {"key": "innovation", "label": "Innovation", "weight": 1},
        {"key": "execution", "label": "Execution", "weight": 1},
        {"key": "design", "label": "Design", "weight": 1},
        {"key": "impact", "label": "Impact", "weight": 1},
    ]


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Post(models.Model):
    POST_TYPE_POST = 'post'
    POST_TYPE_ANNOUNCEMENT = 'announcement'
    POST_TYPE_RESULT = 'result'

    POST_TYPE_CHOICES = [
        (POST_TYPE_POST, 'Post'),
        (POST_TYPE_ANNOUNCEMENT, 'Announcement'),
        (POST_TYPE_RESULT, 'Result'),
    ]

    title = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES, default=POST_TYPE_POST)
    is_pinned = models.BooleanField(default=False)
    pinned_at = models.DateTimeField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    event = models.ForeignKey('Event', on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    tags = models.ManyToManyField(Tag, related_name='posts', blank=True)
    scheduled_for = models.DateTimeField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"Post {self.id}"

class Event(models.Model):
    STATUS_UPCOMING = "upcoming"
    STATUS_REGISTRATION = "registration"
    STATUS_ACTIVE = "active"
    STATUS_SUBMISSION_OPEN = "submission_open"
    STATUS_SUBMISSION_CLOSED = "submission_closed"
    STATUS_JUDGING = "judging"
    STATUS_FINISHED = "finished"

    STATUS_CHOICES = [
        (STATUS_UPCOMING, "Upcoming"),
        (STATUS_REGISTRATION, "Registration"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_SUBMISSION_OPEN, "Submission Open"),
        (STATUS_SUBMISSION_CLOSED, "Submission Closed"),
        (STATUS_JUDGING, "Judging"),
        (STATUS_FINISHED, "Finished"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_premium = models.BooleanField(default=False)
    judging_criteria = models.JSONField(default=default_judging_criteria, blank=True)
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_UPCOMING
    )
    status_override = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        blank=True,
        null=True
    )
    registration_deadline = models.DateTimeField(blank=True, null=True)
    team_deadline = models.DateTimeField(blank=True, null=True)
    submission_open_at = models.DateTimeField(blank=True, null=True)
    submission_deadline = models.DateTimeField(blank=True, null=True)
    judging_start = models.DateTimeField(blank=True, null=True)
    judging_end = models.DateTimeField(blank=True, null=True)
    reviewers_per_submission = models.PositiveIntegerField(default=3)
    max_participants = models.PositiveIntegerField(blank=True, null=True)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organized_events")
    judges = models.ManyToManyField(
        User,
        through='EventJudge',
        related_name='judged_events',
        blank=True
    )
    
    def __str__(self):
        return self.name

    def _effective_submission_open_at(self):
        return self.submission_open_at or self.team_deadline or self.start_date

    def _effective_submission_deadline(self):
        return self.submission_deadline or self.end_date

    def _effective_judging_start(self):
        return self.judging_start or self._effective_submission_deadline()

    def _effective_judging_end(self):
        if self.judging_end:
            return self.judging_end
        # Default grace period after event end
        return (self.end_date or timezone.now()) + timedelta(hours=48)

    def get_status(self, now=None):
        if self.status_override:
            return self.status_override
        now = now or timezone.now()
        reg_deadline = self.registration_deadline or self.start_date
        submission_open_at = self._effective_submission_open_at()
        submission_deadline = self._effective_submission_deadline()
        judging_start = self._effective_judging_start()
        judging_end = self._effective_judging_end()

        if self.start_date and now < self.start_date:
            return self.STATUS_UPCOMING
        if reg_deadline and now < reg_deadline:
            return self.STATUS_REGISTRATION
        if submission_open_at and now < submission_open_at:
            return self.STATUS_ACTIVE
        if submission_deadline and now < submission_deadline:
            return self.STATUS_SUBMISSION_OPEN
        if judging_start and now < judging_start:
            return self.STATUS_SUBMISSION_CLOSED
        if judging_end and now < judging_end:
            return self.STATUS_JUDGING
        return self.STATUS_FINISHED

    def refresh_status(self, now=None, save=True):
        computed = self.get_status(now=now)
        if self.status != computed:
            self.status = computed
            if save:
                self.save(update_fields=["status"])
        return self.status

    def can_create_team(self, now=None):
        now = now or timezone.now()
        status = self.get_status(now=now)
        if status not in {self.STATUS_REGISTRATION, self.STATUS_ACTIVE}:
            return False
        if self.team_deadline and now > self.team_deadline:
            return False
        return True

    def can_submit(self, now=None):
        now = now or timezone.now()
        status = self.get_status(now=now)
        if status != self.STATUS_SUBMISSION_OPEN:
            return False
        submission_open_at = self._effective_submission_open_at()
        submission_deadline = self._effective_submission_deadline()
        if submission_open_at and now < submission_open_at:
            return False
        if submission_deadline and now > submission_deadline:
            return False
        return True

    def can_enroll(self, team=None, actor=None, now=None):
        now = now or timezone.now()
        status = self.get_status(now=now)
        if status not in {self.STATUS_REGISTRATION, self.STATUS_ACTIVE}:
            return (False, "Enrollment is closed for this event.")

        submission_open_at = self._effective_submission_open_at()
        if submission_open_at and now >= submission_open_at:
            return (False, "Enrollment is closed for this event.")

        if actor is not None and team is not None:
            is_org = False
            try:
                is_org = bool(getattr(actor, "profile", None) and actor.profile.is_organizer)
            except Exception:
                is_org = False
            if not (actor == team.leader or actor.is_staff or actor.is_superuser or is_org):
                return (False, "Only team leader or organizers can enroll.")

        if self.max_participants and team is not None:
            try:
                from .models import TeamEvent
                enrolled_team_ids = TeamEvent.objects.filter(
                    event=self,
                    status=TeamEvent.STATUS_ENROLLED
                ).values_list("team_id", flat=True)
                enrolled_members = Team.objects.filter(id__in=enrolled_team_ids)\
                    .values_list("members", flat=True)\
                    .exclude(members=None)\
                    .distinct()\
                    .count()
                team_members = team.members.count()
                if enrolled_members + team_members > self.max_participants:
                    return (False, "Event is at capacity.")
            except Exception:
                pass

        return (True, "")

    def can_judge(self, now=None):
        now = now or timezone.now()
        status = self.get_status(now=now)
        if status != self.STATUS_JUDGING:
            return False
        judging_start = self._effective_judging_start()
        judging_end = self._effective_judging_end()
        if judging_start and now < judging_start:
            return False
        if judging_end and now > judging_end:
            return False
        return True

class EventJudge(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='event_judges')
    judge = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_judges')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'judge')

    def __str__(self):
        return f"{self.judge.username} -> {self.event.name}"

class EventResource(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event.name} - {self.title}"

class EventSponsor(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="sponsors")
    name = models.CharField(max_length=255)
    logo_url = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    challenge_desc = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event.name} - {self.name}"

class AwardCategory(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="award_categories")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    sponsor = models.ForeignKey(
        EventSponsor,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="sponsored_categories"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event.name} - {self.title}"

class AwardResult(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="award_results")
    submission = models.ForeignKey('Submission', on_delete=models.CASCADE, related_name="award_results")
    category = models.ForeignKey(
        AwardCategory,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="results"
    )
    place = models.PositiveIntegerField(default=0)
    score = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        cat = self.category.title if self.category else "Overall"
        return f"{self.event.name} - {cat} - #{self.place}"

class JudgeAssignment(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="judge_assignments")
    submission = models.ForeignKey('Submission', on_delete=models.CASCADE, related_name="judge_assignments")
    judge = models.ForeignKey(User, on_delete=models.CASCADE, related_name="judge_assignments")
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    override_reason = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("submission", "judge")

    def __str__(self):
        return f"{self.judge.username} assigned to {self.submission_id}"

class Announcement(models.Model):
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True, related_name="announcements")
    title = models.CharField(max_length=255)
    body = models.TextField()
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    action = models.CharField(max_length=100)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} {self.action}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_organizer = models.BooleanField(default=False)
    is_judge = models.BooleanField(default=False)
    organization_name = models.CharField(max_length=200, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='covers/', blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    website_url = models.URLField(blank=True, null=True)
    last_active = models.DateTimeField(blank=True, null=True)
    suspended_until = models.DateTimeField(blank=True, null=True)
    banned_until = models.DateTimeField(blank=True, null=True)
    ban_reason = models.TextField(blank=True, null=True)
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


class ModerationAction(models.Model):
    ACTION_WARN = 'warn'
    ACTION_SUSPEND = 'suspend'
    ACTION_BAN = 'ban'
    ACTION_REACTIVATE = 'reactivate'

    ACTION_CHOICES = [
        (ACTION_WARN, 'Warn'),
        (ACTION_SUSPEND, 'Suspend'),
        (ACTION_BAN, 'Ban'),
        (ACTION_REACTIVATE, 'Reactivate'),
    ]

    moderator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='moderation_actions_made'
    )
    target_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='moderation_actions_received'
    )
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField(blank=True, null=True)
    duration = models.DurationField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.action_type} -> {self.target_user.username}"


class UserWarning(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='warnings')
    warned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='warnings_issued')
    reason = models.TextField(blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Warning for {self.user.username}"


class AccountDeletionLog(models.Model):
    user_id = models.IntegerField()
    username = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    deleted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deletion_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Deletion log for {self.username}"
    
    
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
    leader = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="led_teams"
    )
    max_members = models.PositiveIntegerField(default=4)
    members = models.ManyToManyField(User, related_name="teams", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TeamEvent(models.Model):
    STATUS_ENROLLED = "enrolled"
    STATUS_WITHDRAWN = "withdrawn"
    STATUS_DISQUALIFIED = "disqualified"

    STATUS_CHOICES = [
        (STATUS_ENROLLED, "Enrolled"),
        (STATUS_WITHDRAWN, "Withdrawn"),
        (STATUS_DISQUALIFIED, "Disqualified"),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="enrollments")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="team_enrollments")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ENROLLED)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    withdrawn_at = models.DateTimeField(blank=True, null=True)
    disqualified_at = models.DateTimeField(blank=True, null=True)
    status_changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="team_event_status_changes"
    )
    status_reason = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("team", "event")

    def __str__(self):
        return f"{self.team.name} @ {self.event.name}"

    @staticmethod
    def can_enroll(team, event, actor):
        if not team or not event:
            return (False, "Invalid team or event.")
        if TeamEvent.objects.filter(team=team, event=event, status=TeamEvent.STATUS_DISQUALIFIED).exists():
            return (False, "Team is disqualified for this event.")
        return event.can_enroll(team=team, actor=actor)

class Submission(models.Model):
    WINNER_PLACE_CHOICES = [
        ('1st', '1st Place'),
        ('2nd', '2nd Place'),
        ('3rd', '3rd Place'),
        ('honorable_mention', 'Honorable Mention'),
    ]

    team_event = models.ForeignKey(TeamEvent, on_delete=models.CASCADE, related_name="submissions")
    submitted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="submissions_made"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    summary = models.TextField(blank=True, null=True)
    demo_url = models.URLField(blank=True, null=True)
    repo_url = models.URLField(blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    technologies = models.JSONField(default=list, blank=True)
    key_features = models.JSONField(default=list, blank=True)
    screenshots = models.JSONField(default=list, blank=True)
    file = models.FileField(upload_to="submissions/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0)
    is_reviewed = models.BooleanField(default=False)
    is_winner = models.BooleanField(default=False)
    is_locked_after_deadline = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    score_locked_at = models.DateTimeField(null=True, blank=True)
    score_locked_by_system = models.BooleanField(default=False)
    judging_complete_at = models.DateTimeField(null=True, blank=True)
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
        else:
            self.score = 0

        event = self.team_event.event if self.team_event else None
        required_judges = event.reviewers_per_submission if event else 0
        completed_judges = 0
        if event:
            assigned = self.judge_assignments.filter(is_active=True).values_list("judge_id", flat=True)
            if assigned:
                completed_judges = feedbacks.filter(judge_id__in=assigned).count()
            else:
                completed_judges = feedbacks.filter(judge__in=event.judges.all()).count()

        was_complete = self.judging_complete_at is not None
        is_complete = required_judges > 0 and completed_judges >= required_judges
        self.is_reviewed = is_complete

        if is_complete and not was_complete:
            self.judging_complete_at = timezone.now()
            if event and timezone.now() >= event._effective_judging_end():
                self.score_locked_by_system = True
                self.score_locked_at = timezone.now()
            try:
                exists = Activity.objects.filter(
                    user=event.organizer,
                    submission=self,
                    type='review'
                ).exists()
                if not exists:
                    Activity.objects.create(
                        user=event.organizer,
                        type='review',
                        title='Judging Complete',
                        description=f'All judges scored "{self.title}".',
                        metadata={
                            'event_id': event.id,
                            'submission_id': self.id,
                            'required_judges': required_judges,
                            'completed_judges': completed_judges
                        },
                        submission=self,
                        event=event
                    )
            except Exception:
                pass
        elif not is_complete:
            self.judging_complete_at = None

        self.save()
        if event:
            try:
                _auto_assign_event_winners(event)
            except Exception:
                pass
        return self.score

def _auto_assign_event_winners(event):
    """Auto-announce winners once all submissions are fully reviewed."""
    if not event:
        return
    now = timezone.now()
    if event and now < event._effective_judging_end():
        return
    submissions_qs = Submission.objects.filter(team_event__event=event)
    if not submissions_qs.exists():
        return
    # Only announce when all submissions are reviewed
    if submissions_qs.filter(is_reviewed=False).exists():
        return

    ranked = list(submissions_qs.order_by('-score', 'created_at'))
    if not ranked:
        return

    # Reset winners first
    submissions_qs.update(is_winner=False, winner_place=None, winner_prize=None)
    try:
        AwardResult.objects.filter(event=event).delete()
    except Exception:
        pass

    places = ['1st', '2nd', '3rd', 'honorable_mention']
    winners = []
    for idx, sub in enumerate(ranked[:len(places)]):
        sub.is_winner = True
        sub.winner_place = places[idx]
        if sub.winner_prize is None:
            sub.winner_prize = ''
        sub.save(update_fields=['is_winner', 'winner_place', 'winner_prize'])
        try:
            AwardResult.objects.create(
                event=event,
                submission=sub,
                category=None,
                place=idx + 1,
                score=sub.score
            )
        except Exception:
            pass
        winners.append(sub)

    # Category winners (top score per category)
    try:
        categories = AwardCategory.objects.filter(event=event)
        for cat in categories:
            top = ranked[0] if ranked else None
            if not top:
                continue
            AwardResult.objects.create(
                event=event,
                submission=top,
                category=cat,
                place=1,
                score=top.score
            )
    except Exception:
        pass

    # Winner activities (avoid duplicates)
    try:
        from .utils.activity_helpers import create_winner_activity
        for sub in winners:
            for member in sub.team_event.team.members.all():
                exists = Activity.objects.filter(
                    user=member,
                    submission=sub,
                    type='winner'
                ).exists()
                if not exists:
                    create_winner_activity(member, sub)
    except Exception:
        pass

    # Upsert results post
    try:
        winners_qs = Submission.objects.filter(team_event__event=event, is_winner=True).select_related('team_event', 'team_event__team')
        winners_count = winners_qs.count()

        order_map = {
            '1st': 1,
            '2nd': 2,
            '3rd': 3,
            'honorable_mention': 4
        }
        winners_list = list(winners_qs)
        winners_list.sort(key=lambda s: (order_map.get(s.winner_place or '', 99), -(s.score or 0)))

        if winners_count == 0:
            content = f"Results for {event.name}. No winners announced yet."
        else:
            lines = [f"Results for {event.name}. Winners announced: {winners_count}."]
            for w in winners_list[:5]:
                place = w.winner_place or "winner"
                team_name = w.team_event.team.name if w.team_event and w.team_event.team else "Team"
                title = w.title or "Submission"
                prize = f" - {w.winner_prize}" if w.winner_prize else ""
                lines.append(f"- {place}: {team_name} ({title}){prize}")
            content = "\n".join(lines)

        post = Post.objects.filter(post_type=Post.POST_TYPE_RESULT, event=event).first()
        if post:
            post.title = f"Results: {event.name}"
            post.content = content
            post.owner = event.organizer
            post.save()
        else:
            Post.objects.create(
                title=f"Results: {event.name}",
                content=content,
                owner=event.organizer,
                post_type=Post.POST_TYPE_RESULT,
                event=event
            )
    except Exception:
        pass

class MediaAsset(models.Model):
    TYPE_IMAGE = "image"
    TYPE_VIDEO = "video"
    TYPE_DECK = "deck"
    TYPE_CHOICES = [
        (TYPE_IMAGE, "Image"),
        (TYPE_VIDEO, "Video"),
        (TYPE_DECK, "Deck"),
    ]

    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="media_assets")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    url = models.URLField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.submission_id} - {self.type}"

class JudgeFeedback(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="feedback")
    judge = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.FloatField()
    comment = models.TextField()
    criteria_scores = models.JSONField(default=dict, blank=True)
    criteria_snapshot = models.JSONField(default=list, blank=True)
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

        # Post Interactions
        ('like', 'Post Liked'),
        ('repost', 'Post Reposted'),
        ('reply', 'Post Replied'),
        
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


class PostLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f"{self.user.username} likes {self.post.id}"


class PostRepost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_reposts')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reposts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f"{self.user.username} reposted {self.post.id}"


class Conversation(models.Model):
    is_team = models.BooleanField(default=False)
    team = models.ForeignKey('Team', on_delete=models.CASCADE, null=True, blank=True, related_name='conversations')
    participants = models.ManyToManyField(User, through='ConversationParticipant', related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.is_team and self.team:
            return f"Team chat: {self.team.name}"
        return f"Conversation {self.id}"


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participant_links')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f"{self.user.username} in convo {self.conversation_id}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_sent')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.id} in convo {self.conversation_id}"

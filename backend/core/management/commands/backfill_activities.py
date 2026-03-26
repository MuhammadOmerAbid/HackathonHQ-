from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Team, Submission, JudgeFeedback, Activity, UserProfile
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Backfill activities for existing data'

    def handle(self, *args, **options):
        self.stdout.write('Starting activity backfill...')
        
        # Counter for stats
        stats = {
            'team_creates': 0,
            'team_joins': 0,
            'submissions': 0,
            'feedback': 0,
            'winners': 0,
            'role_changes': 0,
        }

        # 1. Backfill team creations
        self.stdout.write('\n Backfilling team creations...')
        teams = Team.objects.all()
        for team in teams:
            if team.leader:
                activity, created = Activity.objects.get_or_create(
                    user=team.leader,
                    type='team_create',
                    title='Created Team',
                    description=f'You created team "{team.name}"',
                    team=team,
                    metadata={'team_id': team.id, 'team_name': team.name},
                    created_at=team.created_at or timezone.now()
                )
                if created:
                    stats['team_creates'] += 1
                    self.stdout.write(f'Created team creation for "{team.name}"')
        
        # 2. Backfill team joins (all members except leader)
        self.stdout.write('\n👥 Backfilling team joins...')
        for team in teams:
            for member in team.members.all():
                if member != team.leader:
                    activity, created = Activity.objects.get_or_create(
                        user=member,
                        type='team_join',
                        title='Joined Team',
                        description=f'You joined team "{team.name}"',
                        team=team,
                        metadata={'team_id': team.id, 'team_name': team.name},
                        created_at=team.created_at or timezone.now()
                    )
                    if created:
                        stats['team_joins'] += 1
        
        # 3. Backfill submissions
        self.stdout.write('\n Backfilling submissions...')
        submissions = Submission.objects.all()
        for submission in submissions:
            # Activity for submitter
            if submission.submitted_by:
                activity, created = Activity.objects.get_or_create(
                    user=submission.submitted_by,
                    type='submission',
                    title='Project Submitted',
                    description=f'Your project "{submission.title}" was submitted',
                    submission=submission,
                    metadata={'submission_id': submission.id, 'title': submission.title},
                    created_at=submission.created_at or timezone.now(),
                    is_important=True
                )
                if created:
                    stats['submissions'] += 1
            
            # Activities for all team members (if different from submitter)
            if not submission.team_event or not submission.team_event.team:
                continue
            for member in submission.team_event.team.members.all():
                if member != submission.submitted_by:
                    activity, created = Activity.objects.get_or_create(
                        user=member,
                        type='submission',
                        title='Team Submission',
                        description=f'Your team submitted "{submission.title}"',
                        submission=submission,
                        metadata={'submission_id': submission.id, 'title': submission.title},
                        created_at=submission.created_at or timezone.now()
                    )
                    if created:
                        stats['submissions'] += 1
        
        # 4. Backfill feedback
        self.stdout.write('\n💬 Backfilling feedback...')
        feedbacks = JudgeFeedback.objects.all()
        for fb in feedbacks:
            # Create activity for each team member who received feedback
            if not fb.submission.team_event or not fb.submission.team_event.team:
                continue
            for member in fb.submission.team_event.team.members.all():
                activity, created = Activity.objects.get_or_create(
                    user=member,
                    type='feedback',
                    title='Feedback Received',
                    description=f'You received feedback on "{fb.submission.title}"',
                    submission=fb.submission,
                    metadata={
                        'feedback_id': fb.id,
                        'score': fb.score,
                        'submission_title': fb.submission.title
                    },
                    created_at=fb.created_at or timezone.now(),
                    is_important=True
                )
                if created:
                    stats['feedback'] += 1
        
        # 5. Backfill winners
        self.stdout.write('\n🏆 Backfilling winners...')
        winners = Submission.objects.filter(is_winner=True)
        for winner in winners:
            if not winner.team_event or not winner.team_event.team:
                continue
            for member in winner.team_event.team.members.all():
                activity, created = Activity.objects.get_or_create(
                    user=member,
                    type='winner',
                    title='🏆 Winner!',
                    description=f'Your project "{winner.title}" won!',
                    submission=winner,
                    metadata={'submission_id': winner.id, 'title': winner.title},
                    created_at=winner.created_at or timezone.now(),
                    is_important=True
                )
                if created:
                    stats['winners'] += 1
        
        # 6. Backfill role changes (judge/organizer status)
        self.stdout.write('\n👨‍⚖️ Backfilling role changes...')
        users = User.objects.all()
        for user in users:
            profile = getattr(user, 'profile', None)
            if profile:
                if profile.is_judge:
                    activity, created = Activity.objects.get_or_create(
                        user=user,
                        type='became_judge',
                        title='Became a Judge',
                        description='You are now a judge',
                        is_important=True
                    )
                    if created:
                        stats['role_changes'] += 1
                
                if profile.is_organizer:
                    activity, created = Activity.objects.get_or_create(
                        user=user,
                        type='became_organizer',
                        title='Became an Organizer',
                        description='You are now an organizer',
                        is_important=True
                    )
                    if created:
                        stats['role_changes'] += 1

        # Print summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✅ Activity backfill complete!'))
        self.stdout.write('='*50)
        self.stdout.write(f'Team Creations:   {stats["team_creates"]}')
        self.stdout.write(f'Team Joins:        {stats["team_joins"]}')
        self.stdout.write(f'Submissions:       {stats["submissions"]}')
        self.stdout.write(f'Feedback:          {stats["feedback"]}')
        self.stdout.write(f'Winners:           {stats["winners"]}')
        self.stdout.write(f'Role Changes:      {stats["role_changes"]}')
        self.stdout.write('='*50)
        self.stdout.write(self.style.SUCCESS(f' Total activities created: {sum(stats.values())}'))

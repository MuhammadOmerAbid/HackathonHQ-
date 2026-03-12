from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile


class Command(BaseCommand):
    help = 'Make a user a judge (validates they have no teams or submissions)'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')
        parser.add_argument('--remove', action='store_true', help='Remove judge role instead of adding')
        parser.add_argument('--force', action='store_true', help='Skip validation checks')

    def handle(self, *args, **options):
        username = options['username']
        remove = options['remove']
        force = options['force']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User "{username}" does not exist'))
            return

        profile, created = UserProfile.objects.get_or_create(user=user)

        if remove:
            if not profile.is_judge:
                self.stdout.write(self.style.WARNING(f'{username} is not currently a judge'))
                return
            profile.is_judge = False
            profile.save()
            self.stdout.write(self.style.WARNING(f'Removed judge role from {username}'))
            return

        if not force:
            team_count = user.teams.count()
            if team_count > 0:
                self.stdout.write(self.style.ERROR(
                    f'Cannot make {username} a judge — they are on {team_count} team(s). Use --force to override.'
                ))
                return

            sub_count = user.submissions_made.count()
            if sub_count > 0:
                self.stdout.write(self.style.ERROR(
                    f'Cannot make {username} a judge — they have {sub_count} submission(s). Use --force to override.'
                ))
                return

        profile.is_judge = True
        profile.save()
        self.stdout.write(self.style.SUCCESS(f'Successfully made {username} a judge'))
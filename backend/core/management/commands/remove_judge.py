from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile

class Command(BaseCommand):
    help = 'Remove judge status from a user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')

    def handle(self, *args, **options):
        username = options['username']
        try:
            user = User.objects.get(username=username)
            profile, _ = UserProfile.objects.get_or_create(user=user)

            if not profile.is_judge:
                self.stdout.write(self.style.WARNING(f'{username} is not currently a judge.'))
                return

            profile.is_judge = False
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully removed judge status from {username}'))

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} does not exist'))
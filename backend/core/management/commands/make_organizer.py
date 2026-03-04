from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile

class Command(BaseCommand):
    help = 'Make a user an event organizer'
    
    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')
        parser.add_argument('--organization', type=str, help='Organization name', default='')
    
    def handle(self, *args, **options):
        username = options['username']
        organization = options['organization']
        
        try:
            user = User.objects.get(username=username)
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.is_organizer = True
            profile.organization_name = organization
            profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully made {username} an organizer')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User {username} does not exist')
            )
from django.conf import settings
from django.db import migrations


def backfill_user_profiles(apps, schema_editor):
    UserProfile = apps.get_model('core', 'UserProfile')
    app_label, model_name = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(app_label, model_name)

    existing_ids = set(UserProfile.objects.values_list('user_id', flat=True))
    missing_users = User.objects.exclude(id__in=existing_ids)

    profiles = [UserProfile(user_id=user.id) for user in missing_users]
    if profiles:
        UserProfile.objects.bulk_create(profiles, ignore_conflicts=True)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_userprofile_roles_and_moderation'),
    ]

    operations = [
        migrations.RunPython(backfill_user_profiles, migrations.RunPython.noop),
    ]

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_post_system'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EventJudge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='event_judges', to='core.event')),
                ('judge', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='event_judges', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('event', 'judge')},
            },
        ),
        migrations.AddField(
            model_name='event',
            name='judges',
            field=models.ManyToManyField(blank=True, related_name='judged_events', through='core.EventJudge', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='submission',
            name='judging_complete_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

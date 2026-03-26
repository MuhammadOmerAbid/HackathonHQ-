from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def forwards(apps, schema_editor):
    Team = apps.get_model("core", "Team")
    TeamEvent = apps.get_model("core", "TeamEvent")
    Submission = apps.get_model("core", "Submission")

    for team in Team.objects.all():
        event_id = getattr(team, "event_id", None)
        if not event_id:
            continue
        te, _ = TeamEvent.objects.get_or_create(
            team_id=team.id,
            event_id=event_id,
            defaults={"status": "enrolled"}
        )
        Submission.objects.filter(team_id=team.id).update(team_event_id=te.id)


def backwards(apps, schema_editor):
    # No-op: irreversible without restoring removed fields
    return


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0020_event_submission_open_at"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TeamEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("enrolled", "Enrolled"), ("withdrawn", "Withdrawn"), ("disqualified", "Disqualified")], default="enrolled", max_length=20)),
                ("enrolled_at", models.DateTimeField(auto_now_add=True)),
                ("withdrawn_at", models.DateTimeField(blank=True, null=True)),
                ("disqualified_at", models.DateTimeField(blank=True, null=True)),
                ("status_reason", models.TextField(blank=True, null=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="team_enrollments", to="core.event")),
                ("team", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="enrollments", to="core.team")),
                ("status_changed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="team_event_status_changes", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "unique_together": {("team", "event")},
            },
        ),
        migrations.AddField(
            model_name="event",
            name="max_participants",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="submission",
            name="team_event",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="core.teamevent"),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(
            model_name="submission",
            name="team",
        ),
        migrations.RemoveField(
            model_name="team",
            name="event",
        ),
        migrations.AlterField(
            model_name="submission",
            name="team_event",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="core.teamevent"),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0019_alter_announcement_id_alter_auditlog_actor_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="submission_open_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

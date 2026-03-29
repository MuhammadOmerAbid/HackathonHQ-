from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0021_global_teams_teamevent"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventsponsor",
            name="tier",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]

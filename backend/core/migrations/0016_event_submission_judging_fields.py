from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_alter_activity_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='judging_criteria',
            field=models.JSONField(blank=True, default=[
                {'key': 'innovation', 'label': 'Innovation', 'weight': 1},
                {'key': 'execution', 'label': 'Execution', 'weight': 1},
                {'key': 'design', 'label': 'Design', 'weight': 1},
                {'key': 'impact', 'label': 'Impact', 'weight': 1},
            ]),
        ),
        migrations.AddField(
            model_name='submission',
            name='summary',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='submission',
            name='demo_url',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='submission',
            name='repo_url',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='submission',
            name='video_url',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='submission',
            name='technologies',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='submission',
            name='key_features',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='submission',
            name='screenshots',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='judgefeedback',
            name='criteria_scores',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='judgefeedback',
            name='criteria_snapshot',
            field=models.JSONField(blank=True, default=list),
        ),
    ]

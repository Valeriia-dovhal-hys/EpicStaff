# Generated by Django 5.1.3 on 2025-04-09 09:41

import django.db.models.deletion
from django.db import migrations, models

def delete_realtimeagent_data(apps, schema_editor):
    RealtimeAgent = apps.get_model("tables", "RealtimeAgent")
    RealtimeAgent.objects.all().delete()

def reverse_realtimeagent_data(apps, schema_editor):
    pass
class Migration(migrations.Migration):

    dependencies = [
        ('tables', '0076_realtimeconfig_custom_name'),
    ]

    operations = [
        migrations.RunPython(delete_realtimeagent_data, reverse_realtimeagent_data),

        migrations.RemoveField(
            model_name='realtimeagent',
            name='connection_key',
        ),
        migrations.RemoveField(
            model_name='realtimeagent',
            name='id',
        ),
        migrations.AddField(
            model_name='realtimeagent',
            name='language',
            field=models.CharField(blank=True, help_text='ISO-639-1 format', max_length=2, null=True),
        ),
        migrations.AddField(
            model_name='realtimeagent',
            name='stop_prompt',
            field=models.CharField(blank=True, default='stop', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='realtimeagent',
            name='voice',
            field=models.CharField(choices=[('alloy', 'Alloy'), ('ash', 'Ash'), ('ballad', 'Ballad'), ('coral', 'Coral'), ('echo', 'Echo'), ('fable', 'Fable'), ('onyx', 'Onyx'), ('nova', 'Nova'), ('sage', 'Sage'), ('shimmer', 'Shimmer'), ('verse', 'Verse')], default='alloy', max_length=20),
        ),
        migrations.AddField(
            model_name='realtimeagent',
            name='voice_recognition_prompt',
            field=models.TextField(blank=True, help_text="The prompt to use for the transcription, to guide the model (e.g. 'Expect words related to technology')", null=True),
        ),
        migrations.AddField(
            model_name='realtimeagent',
            name='wake_word',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='realtimeagent',
            name='agent',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to='tables.agent'),
        ),
        migrations.AlterModelTable(
            name='realtimeagent',
            table='realtime_agent',
        ),
        migrations.CreateModel(
            name='RealtimeAgentChat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('search_limit', models.PositiveIntegerField(blank=True, default=3, help_text='Integer between 0 and 1000 for knowledge')),
                ('distance_threshold', models.DecimalField(blank=True, decimal_places=2, default=0.65, help_text='Float between 0.00 and 1.00 for knowledge', max_digits=3)),
                ('connection_key', models.TextField()),
                ('wake_word', models.CharField(blank=True, max_length=255, null=True)),
                ('stop_prompt', models.CharField(blank=True, default='stop', max_length=255, null=True)),
                ('language', models.CharField(blank=True, help_text='ISO-639-1 format', max_length=2, null=True)),
                ('voice_recognition_prompt', models.TextField(blank=True, help_text="The prompt to use for the transcription, to guide the model (e.g. 'Expect words related to technology')", null=True)),
                ('voice', models.CharField(choices=[('alloy', 'Alloy'), ('ash', 'Ash'), ('ballad', 'Ballad'), ('coral', 'Coral'), ('echo', 'Echo'), ('fable', 'Fable'), ('onyx', 'Onyx'), ('nova', 'Nova'), ('sage', 'Sage'), ('shimmer', 'Shimmer'), ('verse', 'Verse')], default='alloy', max_length=20)),
                ('rt_agent', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='tables.realtimeagent')),
            ],
            options={
                'db_table': 'realtime_agent_chat',
            },
        ),
    ]

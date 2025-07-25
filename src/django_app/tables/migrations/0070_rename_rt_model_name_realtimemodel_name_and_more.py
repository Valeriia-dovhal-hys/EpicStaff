# Generated by Django 5.1.3 on 2025-03-25 12:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tables", "0069_alter_defaultagentconfig_default_temperature"),
    ]

    operations = [
        migrations.RenameField(
            model_name="realtimemodel",
            old_name="rt_model_name",
            new_name="name",
        ),
        migrations.RemoveField(
            model_name="realtimeagent",
            name="model",
        ),
        migrations.CreateModel(
            name="RealtimeConfig",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("api_key", models.TextField()),
                (
                    "realtime_model",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tables.realtimemodel",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="realtimeagent",
            name="realtime_config",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="tables.realtimeconfig",
            ),
        ),
    ]

# Generated by Django 5.1.3 on 2025-02-25 13:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tables", "0056_crewnode_position_graph_metadata_llmnode_position_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="graph",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="defaultllmconfig",
            name="max_tokens",
            field=models.IntegerField(blank=True, default=4096, null=True),
        ),
    ]

# Generated by Django 5.1.3 on 2025-02-14 10:39

from django.db import migrations
from pgvector.django import VectorExtension


class Migration(migrations.Migration):

    dependencies = [
        ("tables", "0047_session_status_data_alter_conditionaledge_graph_and_more"),
    ]

    operations = [
        VectorExtension(),
    ]

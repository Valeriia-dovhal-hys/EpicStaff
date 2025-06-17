from django.db import migrations

def create_default_llm_model(apps, schema_editor):
    LLMModel = apps.get_model('tables', 'LLMModel')
    Provider = apps.get_model('tables', 'Provider')

    provider, _ = Provider.objects.get_or_create(name="openai")

    LLMModel.objects.get_or_create(
        name="gpt-4o",
        defaults={
            "llm_provider": provider,
            "is_visible": True,
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('tables', '0020_llmmodel_is_visible_alter_crew_embedding_model_and_more'),
    ]

    operations = [
        migrations.RunPython(create_default_llm_model),
    ]

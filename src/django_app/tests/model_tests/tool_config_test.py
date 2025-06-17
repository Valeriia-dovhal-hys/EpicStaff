import pytest
from tables.models import ToolConfig
from tests.fixtures import *


@pytest.mark.django_db
def test_tool_config_llm_and_embedding_field_deletion(
    test_tool_with_fields, llm_config, embedding_config
):

    tool = test_tool_with_fields
    name = "tool_configuration_validation config"
    configuration = {
        "llm_config": llm_config.pk,
        "embedding_config": embedding_config.pk,
        "url": "http://some-url.com",
    }

    tool_config = ToolConfig.objects.create(
        tool=tool, name=name, configuration=configuration
    )

    assert tool_config.configuration["llm_config"] == configuration["llm_config"]
    assert (
        tool_config.configuration["embedding_config"]
        == configuration["embedding_config"]
    )

    llm_config.delete()
    tool_config.refresh_from_db()

    assert tool_config.configuration["llm_config"] == None
    assert (
        tool_config.configuration["embedding_config"]
        == configuration["embedding_config"]
    )

    embedding_config.delete()
    tool_config.refresh_from_db()

    assert tool_config.configuration["llm_config"] == None
    assert tool_config.configuration["embedding_config"] == None


@pytest.mark.django_db
def test_tool_config_llm_and_embedding_field_deletion_do_not_affect_fields_with_another_value(
    test_tool_with_fields,
    llm_config,
    embedding_config,
):

    tool = test_tool_with_fields
    name = "tool_configuration_validation config"
    configuration = {
        "llm_config": llm_config.pk,
        "embedding_config": embedding_config.pk,
        "url": "http://some-url.com",
    }

    tool_config = ToolConfig.objects.create(
        tool=tool, name=name, configuration=configuration
    )
    # Create copy of llm config abd embedding config and delete it (new pk will be assigned)
    llm_config.pk = None
    llm_config.custom_name = "testing"
    llm_config.save()
    llm_config.refresh_from_db()
    llm_config.delete()

    embedding_config.pk = None
    embedding_config.custom_name = "testing"
    embedding_config.save()
    embedding_config.refresh_from_db()
    embedding_config.delete()

    assert tool_config.configuration["llm_config"] == configuration["llm_config"]
    assert (
        tool_config.configuration["embedding_config"]
        == configuration["embedding_config"]
    )

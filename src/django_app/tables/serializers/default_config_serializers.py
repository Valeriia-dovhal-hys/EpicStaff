from rest_framework import serializers

from tables.models import (
    DefaultAgentConfig,
    DefaultCrewConfig,
    DefaultToolConfig,
)
from tables.models.realtime_models import DefaultRealtimeAgentConfig


class DefaultRealtimeAgentConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultRealtimeAgentConfig
        fields = '__all__'


class DefaultAgentConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultAgentConfig
        fields = '__all__'


class DefaultCrewConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultCrewConfig
        fields = '__all__'


class DefaultToolConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultToolConfig
        fields = '__all__'


class DefaultConfigSerializer(serializers.Serializer):
    default_agent_config = DefaultAgentConfigSerializer()
    default_realtime_agent_config = DefaultRealtimeAgentConfigSerializer()
    default_crew_config = DefaultCrewConfigSerializer()
    default_tool_config = DefaultToolConfigSerializer()

from rest_framework import serializers
from tables.models.realtime_models import VoiceChoices


class RunSessionSerializer(serializers.Serializer):
    graph_id = serializers.IntegerField(required=True)
    variables = serializers.DictField(required=False)


class GetUpdatesSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)


class AnswerToLLMSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)
    crew_id = serializers.IntegerField(required=True)
    execution_order = serializers.IntegerField(required=True)
    name = serializers.CharField()
    answer = serializers.CharField()


class EnvironmentConfigSerializer(serializers.Serializer):
    data = serializers.DictField(required=True)


class InitRealtimeSerializer(serializers.Serializer):
    agent_id = serializers.IntegerField(required=True)

from rest_framework import serializers
from .models import (
    SessionMessage,
    Session,
)


class RunCrewSerializer(serializers.Serializer):
    crew_id = serializers.IntegerField(required=True)


class GetUpdatesSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)


class SessionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["status"]


class AnswerToLLMSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)
    answer = serializers.CharField()


class SessionMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionMessage
        fields = "__all__"

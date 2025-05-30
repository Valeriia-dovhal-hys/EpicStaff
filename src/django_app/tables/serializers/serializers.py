from rest_framework import serializers


class RunSessionSerializer(serializers.Serializer):
    crew_id = serializers.IntegerField(required=True)


class GetUpdatesSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)


class AnswerToLLMSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)
    answer = serializers.CharField()



class EnvironmentConfigSerializer(serializers.Serializer):
    data = serializers.DictField(required=True)

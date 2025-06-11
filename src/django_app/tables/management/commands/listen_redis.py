from django.core.management.base import BaseCommand
from tables.services.redis_pubsub import RedisPubSub


class Command(BaseCommand):
    help = "Listen for messages on a Redis channel"

    def handle(self, *args, **kwargs):
        RedisPubSub().listen_for_messages(*args, **kwargs)

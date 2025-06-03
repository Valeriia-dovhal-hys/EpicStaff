import json
import sys
import time
import fakeredis
import pytest
from unittest.mock import patch, MagicMock
from django.core.management import call_command
from tables.models import Session, SessionMessage
from tests.fixtures import *
from tables.management.commands.listen_redis import Command
from threading import Thread



@pytest.mark.django_db(transaction=True)
def test_listen_redis_command(fake_redis_client, crew):

    redis_mock = MagicMock()

    with patch("redis.Redis", redis_mock):
        redis_mock.return_value=fake_redis_client
        
        session = Session(crew=crew, status=Session.SessionStatus.RUN)
        Session.save(session)

        
        from redis import Redis
        redis_client = Redis("localhost", 6379)

        command = Command()
        command.handle()

        redis_client.publish(
            channel="sessions:crewai_output",
            message=json.dumps({"session_id": session.pk, "text": "Some text"}),
        )

        time.sleep(1)
        session_message_list = SessionMessage.objects.filter(session=session)
        assert session_message_list.count() == 1

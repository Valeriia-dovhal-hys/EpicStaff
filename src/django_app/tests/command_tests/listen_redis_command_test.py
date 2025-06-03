import json
import time
import pytest
from tables.models import Session, SessionMessage
from tests.fixtures import *
from tables.management.commands.listen_redis import Command


@pytest.mark.django_db(transaction=True)
def test_listen_redis_crewai_output(fake_redis_client, crew: Crew):
    """
    Test listen_redis command handles crewai output channel
    """
    session = Session(crew=crew, status=Session.SessionStatus.RUN)
    session.save()

    redis_client = fake_redis_client

    command = Command()
    command.handle()

    message_text = "Some text"
    redis_client.publish(
        channel="sessions:crewai_output",
        message=json.dumps({"session_id": session.pk, "text": message_text}),
    )

    # Wait for pubsub thread to handle message
    time.sleep(0.5)

    session_messgae_list = SessionMessage.objects.filter(session=session)
    assert session_messgae_list.count() == 1

    session_message = session_messgae_list.first()

    assert session_message.text == message_text
    assert session_message.session.pk == session.pk


@pytest.mark.django_db(transaction=True)
def test_listen_redis_session_status(fake_redis_client, crew: Crew):
    """
    Test listen_redis command handles session status channel
    """
    session = Session(crew=crew, status=Session.SessionStatus.RUN)
    session.save()

    redis_client = fake_redis_client

    command = Command()
    command.handle()
    for status in Session.SessionStatus:

        redis_client.publish(
            channel="sessions:session_status",
            message=json.dumps({"session_id": session.pk, "status": status}),
        )

        # Wait for pubsub thread to handle message
        time.sleep(0.5)

        updated_session = Session.objects.get(pk=session.pk)
        assert updated_session.status == status

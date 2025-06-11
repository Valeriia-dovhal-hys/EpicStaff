import pytest
from pytest_mock import MockerFixture
from models.models import SessionStatus

from tests.redis.fixtures import ( 
    redis_service,
    mock_crew_container_service,
    mock_docker_client,
    mock_crew_image_service
)

class TestRedis:

    @pytest.mark.asyncio
    async def test_start_session(self, mocker: MockerFixture, redis_service):
        """
            - Given a Redis service with a pubsub setup to listen for start session messages,
            - When a start session message with session ID `123` is received,
            - Then `request_run_crew` should be called once with the session ID `123`.
        """

        redis_service.redis_client = mocker.Mock()
        mock_pubsub = mocker.Mock()
        redis_service.redis_client.pubsub.return_value = mock_pubsub
        redis_service.pubsub = mock_pubsub

        mock_pubsub.subscribe = mocker.AsyncMock()

        async def async_message_generator():
            yield {
                'type': 'message',
                'channel': b'test:sessions:start',
                'data': b'123',
            }
            return

        mock_pubsub.listen.return_value = async_message_generator()

        redis_service.crew_container_service.request_run_crew = mocker.Mock()

        await redis_service.listen_redis()

        redis_service.crew_container_service.request_run_crew.assert_called_once_with(123)


    @pytest.mark.asyncio
    async def test_publish_session_status(self, mocker: MockerFixture, redis_service):
        """
            - Given a session ID and status,
            - When `publish_session_status` is called,
            - Then the status message should be published to the `session_status` channel with the correct session ID and status.
        """

        redis_service._publish = mocker.AsyncMock()

        session_id = 123
        session_status = SessionStatus.ERROR

        await redis_service.publish_session_status(session_id, session_status)

        expected_message = {
            'session_id': session_id,
            'status': session_status.value,
        }

        redis_service._publish.assert_awaited_with("session_status", expected_message)

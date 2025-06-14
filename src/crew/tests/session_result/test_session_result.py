import json
import pytest
import time
import fakeredis
from typing import Optional
from threading import Thread
from unittest.mock import patch

from libraries.crewAI.src.crewai.utilities.logger import Logger

class TestSessionResult:

    def listen_for_message(
        self, 
        pubsub, 
        target_channel: str,
        timeout: int = 5,
    ) -> Optional[dict]:
        """
        Helper method to listen for a specific message on a Redis channel.
        """
        
        start_time = time.time()
        for message in pubsub.listen():
            if time.time() - start_time > timeout:
                break

            if message['type'] == 'message' and message['channel'] == target_channel:
                return message

        return None


    def test_publish_final_result(self, fake_redis_service):
        """
        Verify that the `publish_final_result` method correctly publishes the result to Redis.
        - Subscribe to the target Redis channel using pubsub.
        - Set up a listener thread to capture the published message.
        - Call `publish_final_result` on `fake_redis_service` with a mock result.
        - Assert that a message was received on the target channel.
        - Verify the message data matches the expected result.
        """

        mock_final_result = 'OK'
        target_channel = 'sessions:final_result'

        pubsub = fake_redis_service.redis_client.pubsub()
        pubsub.subscribe(target_channel)

        message_received = {}
        def listen_in_thread():
            result = self.listen_for_message(pubsub, target_channel)
            if result:
                message_received['result'] = result

        listener_thread = Thread(target=listen_in_thread, daemon=True)
        listener_thread.start()

        fake_redis_service.publish_final_result(mock_final_result)

        listener_thread.join(timeout=5)

        assert 'result' in message_received, "Message is not received"
        assert message_received['result']['data'] == json.dumps(mock_final_result)


    def test_logger(self):
        """
        Verify that `Logger.log` correctly publishes log messages to Redis.
        - Mock Redis with `fakeredis`.
        - Initialize a `Logger` instance and subscribe to the target pubsub channel.
        - Set up a listener thread to capture the published log message.
        - Call `log` on the `Logger` instance with a mock log level and message.
        - Assert that a message is received on the target channel.
        - Verify that the logged message matches the expected content, excluding the timestamp.
        """

        with patch('libraries.crewAI.src.crewai.utilities.logger.Redis', fakeredis.FakeStrictRedis):
            logger = Logger()

            target_channel = 'sessions:crewai_output'
            level = 'INFO'
            message = 'Crew message'

            redis_client = logger._redis_client

            pubsub = redis_client.pubsub()
            pubsub.subscribe(target_channel)

            message_received = {}
            
            def listen_in_thread():
                result = self.listen_for_message(pubsub, target_channel)
                if result:
                    message_received['result'] = result

            listener_thread = Thread(target=listen_in_thread, daemon=True)
            listener_thread.start()

            logger.log(level, message)

            listener_thread.join(timeout=5)

            assert 'result' in message_received, "No message received from Redis"

            received_data = message_received['result']['data']

            received_data_dict = json.loads(received_data)
            received_data_dict.pop('timestamp', None)

            expected_message = {
                "session_id": logger.session_id,
                "level": level,
                "text": message,
            }

            assert received_data_dict == expected_message, f"Expected {expected_message}, got {received_data_dict}"

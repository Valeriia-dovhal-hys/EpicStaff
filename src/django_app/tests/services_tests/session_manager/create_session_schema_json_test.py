import pytest
from tables.services.session_manager_service import SessionManagerService
from tests.fixtures import *
import json

@pytest.mark.django_db
def test_create_session_schema_json(crew, session_schema_json):
    session_manager_service = SessionManagerService()

    session_id = session_manager_service.create_session(crew_id=crew.pk)

    expected_dict: dict = json.loads(session_schema_json)
    actual_dict: dict = json.loads(session_manager_service.create_session_schema_json(session_id=session_id))

    expected_dict.pop("created_at", None)
    actual_dict.pop("created_at", None)

    assert actual_dict == expected_dict
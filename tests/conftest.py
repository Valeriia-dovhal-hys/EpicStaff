from dotenv import load_dotenv
import pytest

load_dotenv(r"src/ENV/.env", override=True)


@pytest.fixture(scope="module")
def vcr_config():
    return {
        "ignore_hosts": ["localhost"],
    }
from dotenv import load_dotenv
import pytest

load_dotenv(r"src/ENV/.env", override=True)
test_dir = "tests/tmp/"


@pytest.fixture(scope="module")
def vcr_config():
    return {
        "ignore_hosts": ["localhost"],
    }

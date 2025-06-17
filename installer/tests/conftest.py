import os
import sys
import pytest
from pathlib import Path

# Add the parent directory to sys.path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(autouse=True)
def setup_test_env():
    """Setup and teardown for each test"""
    # Store original environment variables
    original_env = dict(os.environ)

    # Setup test environment
    if sys.platform == "win32":
        os.environ["LOCALAPPDATA"] = os.path.join(os.getcwd(), "test_appdata")
    elif sys.platform == "darwin":
        os.environ["HOME"] = os.path.join(os.getcwd(), "test_home")
    else:
        os.environ["XDG_CONFIG_HOME"] = os.path.join(os.getcwd(), "test_config")

    yield

    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)

    # Cleanup test directories
    for dir_name in ["test_appdata", "test_home", "test_config"]:
        test_dir = os.path.join(os.getcwd(), dir_name)
        if os.path.exists(test_dir):
            import shutil

            shutil.rmtree(test_dir)

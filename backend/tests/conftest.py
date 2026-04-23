"""Configure pytest environment for ResumeAI tests."""
import os
import tempfile
from pathlib import Path

import pytest

# Provide dummy env vars before any app module is imported
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test-key")
os.environ.setdefault("DEBUG", "true")

TEST_DB_PATH = Path(tempfile.gettempdir()) / "resumeai_test.db"
if TEST_DB_PATH.exists():
	TEST_DB_PATH.unlink()
os.environ["DB_PATH"] = str(TEST_DB_PATH)

from app.core.config import get_settings
from app.services.db import init_db, reset_db

get_settings.cache_clear()


@pytest.fixture(autouse=True)
def clean_test_db():
	"""Start each test with a clean isolated sqlite DB outside the repo tree."""
	reset_db(remove_file=True)
	init_db()
	yield


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db_file():
	yield
	reset_db(remove_file=True)

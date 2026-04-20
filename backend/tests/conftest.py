"""Configure pytest environment for ResumeAI tests."""
import os

# Provide dummy env vars before any app module is imported
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test-key")
os.environ.setdefault("DEBUG", "true")

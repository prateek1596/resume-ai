from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.core.config import get_settings


def _db_path() -> Path:
    settings = get_settings()
    path = Path(settings.db_path)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[2] / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def get_connection():
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(email) REFERENCES users(email)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(email) REFERENCES users(email)
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)")
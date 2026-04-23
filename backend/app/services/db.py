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
    def ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
        columns = conn.execute(f"PRAGMA table_info({table})").fetchall()
        names = {row[1] for row in columns}
        if column not in names:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

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
                refresh_token TEXT,
                created_at TEXT NOT NULL,
                expires_at TEXT,
                refresh_expires_at TEXT,
                FOREIGN KEY(email) REFERENCES users(email)
            )
            """
        )
        ensure_column(conn, "sessions", "refresh_token", "TEXT")
        ensure_column(conn, "sessions", "expires_at", "TEXT")
        ensure_column(conn, "sessions", "refresh_expires_at", "TEXT")
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token)")
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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS profile_versions (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                email TEXT NOT NULL,
                version_number INTEGER NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                label TEXT,
                FOREIGN KEY(profile_id) REFERENCES profiles(id),
                FOREIGN KEY(email) REFERENCES users(email)
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_profile_versions_profile ON profile_versions(profile_id, version_number DESC)")
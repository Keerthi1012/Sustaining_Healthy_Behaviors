import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path


SCHEMA_VERSION = 1

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journeys (
    user_id TEXT PRIMARY KEY,
    revision INTEGER NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_habit_states (
    state_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    habit_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, habit_id)
);

CREATE TABLE IF NOT EXISTS habit_feedback (
    feedback_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    state_id TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habit_feedback_state
    ON habit_feedback(state_id, recorded_at);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    user_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    key TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(user_id, operation, key)
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user
    ON auth_tokens(user_id);
"""


class SqliteDatabase:
    """Small sqlite wrapper with lazy initialization and transactions."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self._initialized = False
        self._init_lock = threading.Lock()

    def _connect(self) -> sqlite3.Connection:
        if str(self.path) != ":memory:":
            self.path.parent.mkdir(parents=True, exist_ok=True)

        connection = sqlite3.connect(
            str(self.path),
            timeout=10,
            check_same_thread=False,
        )
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize(self) -> None:
        if self._initialized:
            return

        with self._init_lock:
            if self._initialized:
                return

            connection = self._connect()
            try:
                connection.execute("PRAGMA journal_mode = WAL")
                connection.executescript(SCHEMA_SQL)
                connection.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
                connection.commit()
            finally:
                connection.close()

            self._initialized = True

    @contextmanager
    def transaction(self, write: bool = False):
        self.initialize()
        connection = self._connect()
        try:
            connection.execute(
                "BEGIN IMMEDIATE" if write else "BEGIN"
            )
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

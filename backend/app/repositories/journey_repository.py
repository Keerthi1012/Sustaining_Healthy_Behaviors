import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone

from app.storage.database import SqliteDatabase


class JourneyNotFoundError(KeyError):
    pass


class JourneyRevisionConflictError(Exception):
    def __init__(self, current_revision: int):
        super().__init__("The journey was changed elsewhere")
        self.current_revision = current_revision


class JourneyRevisionRequiredError(Exception):
    pass


@dataclass(frozen=True)
class JourneyRecord:
    user_id: str
    revision: int
    journey: dict
    created_at: str
    updated_at: str


class SqliteJourneyRepository:
    def __init__(
        self,
        database: SqliteDatabase,
        connection: sqlite3.Connection | None = None,
    ):
        self._database = database
        self._connection = connection

    @contextmanager
    def _transaction(self, write: bool = False):
        if self._connection is not None:
            yield self._connection
            return

        with self._database.transaction(write=write) as connection:
            yield connection

    def get(self, user_id: str) -> JourneyRecord | None:
        with self._transaction() as connection:
            row = connection.execute(
                """
                SELECT user_id, revision, payload, created_at, updated_at
                FROM journeys
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()

        if row is None:
            return None

        return JourneyRecord(
            user_id=row["user_id"],
            revision=row["revision"],
            journey=json.loads(row["payload"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def create(
        self,
        user_id: str,
        journey: dict,
    ) -> JourneyRecord:
        now = datetime.now(timezone.utc).isoformat()

        with self._transaction(write=True) as connection:
            existing = connection.execute(
                """
                SELECT revision
                FROM journeys
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()

            if existing is not None:
                raise JourneyRevisionConflictError(
                    existing["revision"]
                )

            connection.execute(
                """
                INSERT INTO journeys (
                    user_id,
                    revision,
                    payload,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    1,
                    json.dumps(journey, separators=(",", ":")),
                    now,
                    now,
                ),
            )

        return JourneyRecord(
            user_id=user_id,
            revision=1,
            journey=journey,
            created_at=now,
            updated_at=now,
        )

    def replace(
        self,
        user_id: str,
        journey: dict,
        expected_revision: int,
    ) -> JourneyRecord:
        now = datetime.now(timezone.utc).isoformat()

        with self._transaction(write=True) as connection:
            row = connection.execute(
                """
                SELECT revision, created_at
                FROM journeys
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()

            if row is None:
                raise JourneyNotFoundError(user_id)

            if row["revision"] != expected_revision:
                raise JourneyRevisionConflictError(row["revision"])

            next_revision = expected_revision + 1

            connection.execute(
                """
                UPDATE journeys
                SET revision = ?, payload = ?, updated_at = ?
                WHERE user_id = ?
                """,
                (
                    next_revision,
                    json.dumps(journey, separators=(",", ":")),
                    now,
                    user_id,
                ),
            )
            created_at = row["created_at"]

        return JourneyRecord(
            user_id=user_id,
            revision=next_revision,
            journey=journey,
            created_at=created_at,
            updated_at=now,
        )

    def delete(self, user_id: str) -> bool:
        with self._transaction(write=True) as connection:
            cursor = connection.execute(
                """
                DELETE FROM journeys
                WHERE user_id = ?
                """,
                (user_id,),
            )

        return cursor.rowcount > 0


class SqliteIdempotencyRepository:
    def __init__(
        self,
        database: SqliteDatabase,
        connection: sqlite3.Connection | None = None,
    ):
        self._database = database
        self._connection = connection

    @contextmanager
    def _transaction(self, write: bool = False):
        if self._connection is not None:
            yield self._connection
            return

        with self._database.transaction(write=write) as connection:
            yield connection

    def get(
        self,
        user_id: str,
        operation: str,
        key: str,
    ) -> dict | None:
        with self._transaction() as connection:
            row = connection.execute(
                """
                SELECT response
                FROM idempotency_keys
                WHERE user_id = ? AND operation = ? AND key = ?
                """,
                (user_id, operation, key),
            ).fetchone()

        if row is None:
            return None

        return json.loads(row["response"])

    def save(
        self,
        user_id: str,
        operation: str,
        key: str,
        response: dict,
    ) -> None:
        with self._transaction(write=True) as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO idempotency_keys (
                    user_id,
                    operation,
                    key,
                    response,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    operation,
                    key,
                    json.dumps(response, separators=(",", ":")),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )

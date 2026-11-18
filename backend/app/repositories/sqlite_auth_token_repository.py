import hashlib
import secrets
import sqlite3
from datetime import datetime, timezone

from app.storage.database import SqliteDatabase


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class SqliteAuthTokenRepository:
    def __init__(self, database: SqliteDatabase):
        self._database = database

    def create(self, user_id: str) -> str:
        while True:
            token = secrets.token_urlsafe(32)
            token_hash = hash_token(token)

            try:
                with self._database.transaction(
                    write=True
                ) as connection:
                    connection.execute(
                        """
                        INSERT INTO auth_tokens (
                            token_hash,
                            user_id,
                            created_at
                        )
                        VALUES (?, ?, ?)
                        """,
                        (
                            token_hash,
                            user_id,
                            datetime.now(timezone.utc).isoformat(),
                        ),
                    )
                return token
            except sqlite3.IntegrityError:
                continue

    def get_user_id(self, token: str) -> str | None:
        with self._database.transaction() as connection:
            row = connection.execute(
                """
                SELECT user_id
                FROM auth_tokens
                WHERE token_hash = ?
                """,
                (hash_token(token),),
            ).fetchone()

        return row["user_id"] if row is not None else None

    def revoke(self, token: str) -> bool:
        with self._database.transaction(write=True) as connection:
            cursor = connection.execute(
                """
                DELETE FROM auth_tokens
                WHERE token_hash = ?
                """,
                (hash_token(token),),
            )

        return cursor.rowcount > 0

import sqlite3
from datetime import datetime

from app.models.auth import UserPublic
from app.repositories.user_repository import UserAccount
from app.storage.database import SqliteDatabase


def _parse_user(row: sqlite3.Row) -> UserPublic:
    return UserPublic(
        user_id=row["user_id"],
        username=row["username"],
        display_name=row["display_name"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


class SqliteUserRepository:
    def __init__(self, database: SqliteDatabase):
        self._database = database

    def create(
        self,
        user: UserPublic,
        password_salt: str,
        password_hash: str,
    ) -> UserPublic:
        try:
            with self._database.transaction(write=True) as connection:
                connection.execute(
                    """
                    INSERT INTO users (
                        user_id,
                        username,
                        display_name,
                        password_salt,
                        password_hash,
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user.user_id,
                        user.username.lower(),
                        user.display_name,
                        password_salt,
                        password_hash,
                        user.created_at.isoformat(),
                    ),
                )
        except sqlite3.IntegrityError as exc:
            raise ValueError("That username is already taken") from exc

        return user.model_copy(deep=True)

    def get_by_username(self, username: str) -> UserAccount | None:
        with self._database.transaction() as connection:
            row = connection.execute(
                """
                SELECT user_id, username, display_name, created_at,
                       password_salt, password_hash
                FROM users
                WHERE username = ?
                """,
                (username.lower(),),
            ).fetchone()

        return self._to_account(row)

    def get_by_id(self, user_id: str) -> UserAccount | None:
        with self._database.transaction() as connection:
            row = connection.execute(
                """
                SELECT user_id, username, display_name, created_at,
                       password_salt, password_hash
                FROM users
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()

        return self._to_account(row)

    @staticmethod
    def _to_account(row: sqlite3.Row | None) -> UserAccount | None:
        if row is None:
            return None

        return UserAccount(
            user=_parse_user(row),
            password_salt=row["password_salt"],
            password_hash=row["password_hash"],
        )

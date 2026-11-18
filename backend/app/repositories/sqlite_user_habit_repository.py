import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from app.models.feedback import HabitFeedback
from app.models.user_habit import UserHabitState
from app.storage.database import SqliteDatabase


class SqliteUserHabitRepository:
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

    def add_state(self, state: UserHabitState) -> None:
        with self._transaction(write=True) as connection:
            try:
                connection.execute(
                    """
                    INSERT INTO user_habit_states (
                        state_id,
                        user_id,
                        habit_id,
                        payload,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        state.state_id,
                        state.user_id,
                        state.habit_id,
                        state.model_dump_json(),
                        datetime.now(timezone.utc).isoformat(),
                    ),
                )
            except sqlite3.IntegrityError as exc:
                raise ValueError(
                    "A state already exists for this user and habit"
                ) from exc

    def get_state(self, state_id: str) -> UserHabitState:
        with self._transaction() as connection:
            row = connection.execute(
                """
                SELECT payload
                FROM user_habit_states
                WHERE state_id = ?
                """,
                (state_id,),
            ).fetchone()

        if row is None:
            raise KeyError(f"User habit state not found: {state_id}")

        return UserHabitState.model_validate_json(row["payload"])

    def get_state_by_user_habit(
        self,
        user_id: str,
        habit_id: str,
    ) -> UserHabitState | None:
        with self._transaction() as connection:
            row = connection.execute(
                """
                SELECT payload
                FROM user_habit_states
                WHERE user_id = ? AND habit_id = ?
                """,
                (user_id, habit_id),
            ).fetchone()

        if row is None:
            return None

        return UserHabitState.model_validate_json(row["payload"])

    def get_feedback_history(
        self,
        state_id: str,
    ) -> list[HabitFeedback]:
        with self._transaction() as connection:
            rows = connection.execute(
                """
                SELECT payload
                FROM habit_feedback
                WHERE state_id = ?
                ORDER BY recorded_at ASC
                """,
                (state_id,),
            ).fetchall()

        return [
            HabitFeedback.model_validate_json(row["payload"])
            for row in rows
        ]

    def save_feedback_and_state(
        self,
        feedback: HabitFeedback,
        updated_state: UserHabitState,
    ) -> None:
        if feedback.user_habit_state_id != updated_state.state_id:
            raise ValueError(
                "Updated state does not match feedback state"
            )

        with self._transaction(write=True) as connection:
            existing = connection.execute(
                """
                SELECT 1
                FROM habit_feedback
                WHERE feedback_id = ?
                """,
                (feedback.feedback_id,),
            ).fetchone()

            if existing is not None:
                raise ValueError("Feedback has already been recorded")

            connection.execute(
                """
                UPDATE user_habit_states
                SET payload = ?, updated_at = ?
                WHERE state_id = ? AND user_id = ?
                """,
                (
                    updated_state.model_dump_json(),
                    datetime.now(timezone.utc).isoformat(),
                    updated_state.state_id,
                    updated_state.user_id,
                ),
            )

            connection.execute(
                """
                INSERT INTO habit_feedback (
                    feedback_id,
                    user_id,
                    state_id,
                    recorded_at,
                    payload
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    feedback.feedback_id,
                    updated_state.user_id,
                    feedback.user_habit_state_id,
                    feedback.recorded_at.isoformat(),
                    feedback.model_dump_json(),
                ),
            )

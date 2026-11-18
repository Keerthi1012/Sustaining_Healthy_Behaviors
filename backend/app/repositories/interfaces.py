from typing import Protocol

from app.models.auth import UserPublic
from app.models.feedback import HabitFeedback
from app.models.user_habit import UserHabitState
from app.repositories.user_repository import UserAccount


class UserRepository(Protocol):
    def create(
        self,
        user: UserPublic,
        password_salt: str,
        password_hash: str,
    ) -> UserPublic: ...

    def get_by_username(self, username: str) -> UserAccount | None: ...

    def get_by_id(self, user_id: str) -> UserAccount | None: ...


class AuthTokenRepository(Protocol):
    def create(self, user_id: str) -> str: ...

    def get_user_id(self, token: str) -> str | None: ...

    def revoke(self, token: str) -> bool: ...


class UserHabitRepository(Protocol):
    def add_state(self, state: UserHabitState) -> None: ...

    def get_state(self, state_id: str) -> UserHabitState: ...

    def get_state_by_user_habit(
        self,
        user_id: str,
        habit_id: str,
    ) -> UserHabitState | None: ...

    def get_feedback_history(
        self,
        state_id: str,
    ) -> list[HabitFeedback]: ...

    def save_feedback_and_state(
        self,
        feedback: HabitFeedback,
        updated_state: UserHabitState,
    ) -> None: ...

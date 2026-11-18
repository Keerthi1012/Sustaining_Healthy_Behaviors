from dataclasses import dataclass

from app.models.auth import UserPublic


@dataclass(frozen=True)
class UserAccount:
    user: UserPublic
    password_salt: str
    password_hash: str


class InMemoryUserRepository:

    def __init__(self):
        self._accounts_by_id: dict[str, UserAccount] = {}
        self._account_ids_by_username: dict[str, str] = {}

    def create(
        self,
        user: UserPublic,
        password_salt: str,
        password_hash: str,
    ) -> UserPublic:
        if user.username in self._account_ids_by_username:
            raise ValueError("That username is already taken")

        account = UserAccount(
            user=user,
            password_salt=password_salt,
            password_hash=password_hash,
        )

        self._accounts_by_id[user.user_id] = account
        self._account_ids_by_username[user.username] = user.user_id

        return user.model_copy(deep=True)

    def get_by_username(self, username: str) -> UserAccount | None:
        user_id = self._account_ids_by_username.get(username.lower())
        if user_id is None:
            return None

        return self._accounts_by_id[user_id]

    def get_by_id(self, user_id: str) -> UserAccount | None:
        return self._accounts_by_id.get(user_id)

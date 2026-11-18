import secrets


class InMemoryAuthTokenRepository:

    def __init__(self):
        self._user_ids_by_token: dict[str, str] = {}

    def create(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)

        while token in self._user_ids_by_token:
            token = secrets.token_urlsafe(32)

        self._user_ids_by_token[token] = user_id
        return token

    def get_user_id(self, token: str) -> str | None:
        return self._user_ids_by_token.get(token)

    def revoke(self, token: str) -> bool:
        return self._user_ids_by_token.pop(token, None) is not None

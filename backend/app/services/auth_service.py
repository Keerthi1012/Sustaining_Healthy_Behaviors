import hashlib
import hmac
import secrets

from app.models.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserPublic,
)
from app.repositories.interfaces import (
    AuthTokenRepository,
    UserRepository,
)

PASSWORD_ITERATIONS = 240_000
PASSWORD_SALT_BYTES = 16
PASSWORD_KEY_BYTES = 32


class DuplicateUsernameError(ValueError):
    pass


class InvalidCredentialsError(ValueError):
    pass


def hash_password(password: str) -> tuple[str, str]:
    salt = secrets.token_bytes(PASSWORD_SALT_BYTES)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
        dklen=PASSWORD_KEY_BYTES,
    )

    return salt.hex(), password_hash.hex()


def verify_password(
    password: str,
    password_salt: str,
    password_hash: str,
) -> bool:
    salt = bytes.fromhex(password_salt)
    expected_hash = bytes.fromhex(password_hash)
    candidate_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
        dklen=PASSWORD_KEY_BYTES,
    )

    return hmac.compare_digest(candidate_hash, expected_hash)


class AuthService:

    def __init__(
        self,
        user_repository: UserRepository,
        token_repository: AuthTokenRepository,
    ):
        self._users = user_repository
        self._tokens = token_repository

    def register(self, payload: RegisterRequest) -> AuthResponse:
        password_salt, password_hash = hash_password(payload.password)
        user = UserPublic(
            username=payload.username,
            display_name=payload.display_name or payload.username,
        )

        try:
            stored_user = self._users.create(
                user,
                password_salt,
                password_hash,
            )
        except ValueError as exc:
            raise DuplicateUsernameError(str(exc)) from exc

        token = self._tokens.create(stored_user.user_id)
        return AuthResponse(token=token, user=stored_user)

    def login(self, payload: LoginRequest) -> AuthResponse:
        account = self._users.get_by_username(payload.username)

        if account is None or not verify_password(
            payload.password,
            account.password_salt,
            account.password_hash,
        ):
            raise InvalidCredentialsError(
                "That username and password do not match"
            )

        token = self._tokens.create(account.user.user_id)
        return AuthResponse(
            token=token,
            user=account.user.model_copy(deep=True),
        )

    def authenticate(self, token: str) -> UserPublic | None:
        user_id = self._tokens.get_user_id(token)
        if user_id is None:
            return None

        account = self._users.get_by_id(user_id)
        if account is None:
            return None

        return account.user.model_copy(deep=True)

    def logout(self, token: str) -> None:
        self._tokens.revoke(token)

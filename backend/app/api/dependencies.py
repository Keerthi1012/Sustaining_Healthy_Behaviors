from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from app.models.auth import UserPublic

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthContext:
    token: str
    user: UserPublic


def unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Please log in to continue",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_auth_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> AuthContext:
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
    ):
        raise unauthorized()

    auth_service = request.app.state.auth_service
    user = auth_service.authenticate(credentials.credentials)

    if user is None:
        raise unauthorized()

    return AuthContext(
        token=credentials.credentials,
        user=user,
    )

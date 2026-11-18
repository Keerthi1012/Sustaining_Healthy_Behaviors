from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.api.dependencies import AuthContext, get_auth_context
from app.models.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserPublic,
)
from app.services.auth_service import (
    DuplicateUsernameError,
    InvalidCredentialsError,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    request: Request,
):
    auth_service = request.app.state.auth_service

    try:
        return auth_service.register(payload)
    except DuplicateUsernameError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    request: Request,
):
    auth_service = request.app.state.auth_service

    try:
        return auth_service.login(payload)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.get("/me", response_model=UserPublic)
def get_me(
    auth: AuthContext = Depends(get_auth_context),
):
    return auth.user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
):
    request.app.state.auth_service.logout(auth.token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

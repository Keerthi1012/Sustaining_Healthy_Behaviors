from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(
        min_length=3,
        max_length=24,
        pattern=r"^[A-Za-z0-9_]+$",
    )
    display_name: str | None = Field(
        default=None,
        max_length=40,
    )
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=3, max_length=24)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: str = Field(default_factory=lambda: str(uuid4()))
    username: str
    display_name: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserPublic

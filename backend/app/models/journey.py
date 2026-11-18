from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.services.progression_service import ProgressionDecision


class JourneyPlan(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(min_length=1, max_length=200)
    days: list[dict] = Field(default_factory=list)

    @field_validator("days")
    @classmethod
    def validate_days(cls, days: list[dict]) -> list[dict]:
        for day in days:
            if not isinstance(day, dict):
                raise ValueError("Each journey day must be an object")
            if not day.get("id"):
                raise ValueError("Each journey day needs an id")

        return days


class Journey(BaseModel):
    model_config = ConfigDict(extra="allow")

    profile: dict
    plan: JourneyPlan
    preferences: dict = Field(default_factory=dict)
    version: int = 2

    @model_validator(mode="after")
    def reject_reserved_fields(self):
        if self.model_extra and "user_id" in self.model_extra:
            raise ValueError("Journey ownership is set by the server")

        return self


class JourneyUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    journey: Journey
    expected_revision: int | None = Field(default=None, ge=0)


class JourneyResponse(BaseModel):
    journey: dict
    revision: int


class CompletionFeedback(BaseModel):
    model_config = ConfigDict(extra="forbid")

    difficulty: Literal[
        "easy",
        "comfortable",
        "difficult",
        "too_much",
        "uncomfortable",
    ]
    barrier: str | None = Field(default=None, max_length=120)
    safety: Literal["none", "pain", "concerning_symptom"] = "none"
    enjoyment: Literal["not_for_me", "okay", "loved"] = "okay"


class CompletionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    day_id: str = Field(min_length=1, max_length=200)
    slot: Literal["primary", "secondary"]
    expected_revision: int = Field(ge=0)
    feedback: CompletionFeedback


class CompletionResponse(JourneyResponse):
    decision: ProgressionDecision | None = None

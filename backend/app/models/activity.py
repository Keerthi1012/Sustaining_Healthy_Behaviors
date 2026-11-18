from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.common import (
    ActivityIntensity,
    ActivitySource,
    ActivityType,
)


class ActivityObservation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    observation_id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    user_id: str = Field(min_length=1)

    activity_type: ActivityType

    source: ActivitySource

    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    recorded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    duration_minutes: float | None = Field(
        default=None,
        gt=0,
    )

    steps: int | None = Field(
        default=None,
        gt=0,
    )

    distance_meters: float | None = Field(
        default=None,
        gt=0,
    )

    intensity: ActivityIntensity = ActivityIntensity.UNKNOWN

    user_habit_state_id: str | None = None

    source_event_id: str | None = None

    @model_validator(mode="after")
    def validate_activity_measurements(self):
        if all(
            value is None
            for value in (
                self.duration_minutes,
                self.steps,
                self.distance_meters,
            )
        ):
            raise ValueError(
                "At least one activity measurement is required"
            )

        return self
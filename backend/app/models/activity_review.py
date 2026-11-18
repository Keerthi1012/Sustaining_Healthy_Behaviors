
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)

from app.models.common import (
    ActivityIntensity,
    ActivityReviewStatus,
)


class ActivityIntensityReview(BaseModel):
    model_config = ConfigDict(extra="forbid")

    review_id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    user_id: str = Field(min_length=1)

    period_start: datetime

    period_end: datetime

    observation_ids: list[str] = Field(min_length=2)

    status: ActivityReviewStatus = ActivityReviewStatus.PENDING

    confirmed_intensity: ActivityIntensity | None = None

    reviewed_at: datetime | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    @model_validator(mode="after")
    def validate_review(self):
        # Both interval timestamps must be timezone-aware.
        if (
            self.period_start.tzinfo is None
            or self.period_start.utcoffset() is None
            or self.period_end.tzinfo is None
            or self.period_end.utcoffset() is None
        ):
            raise ValueError(
                "Review period timestamps must be timezone-aware"
            )

        if self.period_end <= self.period_start:
            raise ValueError(
                "Review period end must be after start"
            )

        # Each observation must be unique and non-empty.
        if any(not item.strip() for item in self.observation_ids):
            raise ValueError(
                "Observation IDs cannot be empty"
            )

        if len(set(self.observation_ids)) != len(
            self.observation_ids
        ):
            raise ValueError(
                "Duplicate observation IDs are not allowed"
            )

        # Validate the review outcome.
        if self.status == ActivityReviewStatus.PENDING:
            if (
                self.confirmed_intensity is not None
                or self.reviewed_at is not None
            ):
                raise ValueError(
                    "Pending reviews cannot have a result or review timestamp"
                )

        elif self.status == ActivityReviewStatus.CONFIRMED:
            if self.confirmed_intensity in (
                None,
                ActivityIntensity.UNKNOWN,
            ):
                raise ValueError(
                    "Confirmed reviews require a known intensity"
                )

            if self.reviewed_at is None:
                raise ValueError(
                    "Confirmed reviews require reviewed_at"
                )

        elif self.status == ActivityReviewStatus.UNRESOLVED:
            if self.confirmed_intensity is not None:
                raise ValueError(
                    "Unresolved reviews cannot have confirmed intensity"
                )

            if self.reviewed_at is None:
                raise ValueError(
                    "Unresolved reviews require reviewed_at"
                )

        # Review timestamp, when present, must include timezone.
        if (
            self.reviewed_at is not None
            and (
                self.reviewed_at.tzinfo is None
                or self.reviewed_at.utcoffset() is None
            )
        ):
            raise ValueError(
                "Review timestamp must be timezone-aware"
            )

        return self

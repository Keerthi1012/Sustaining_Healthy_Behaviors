from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import HabitCatalog
from app.models.common import FeedbackDifficulty, SafetySignal

__all__ = [
    "HabitCatalog",
    "ProgressionEvaluationRequest",
    "ProgressionFeedbackPreview",
]


class ProgressionFeedbackPreview(BaseModel):
    """A completed observation used to preview the next progression level."""

    model_config = ConfigDict(extra="forbid")

    completed: bool
    difficulty: FeedbackDifficulty
    safety_signal: SafetySignal = SafetySignal.NONE
    recorded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class ProgressionEvaluationRequest(BaseModel):
    """Input for a read-only progression decision preview."""

    model_config = ConfigDict(extra="forbid")

    habit_id: str | None = None
    current_level: int = Field(ge=1)
    progression_paused: bool = False
    feedback_history: list[ProgressionFeedbackPreview] = Field(
        default_factory=list
    )

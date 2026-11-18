from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import FeedbackDifficulty, SafetySignal


class HabitFeedback(BaseModel):
    model_config = ConfigDict(extra="forbid")

    feedback_id: str = Field(default_factory=lambda: str(uuid4()))
    user_habit_state_id: str = Field(min_length=1)
    completed: bool
    difficulty: FeedbackDifficulty
    safety_signal: SafetySignal = SafetySignal.NONE
    recorded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    note: str | None = Field(default=None, max_length=300)
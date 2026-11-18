
from datetime import datetime, timezone
from uuid import uuid4
from app.models.common import HabitStatus, TargetMetric
from pydantic import BaseModel, ConfigDict, Field

from app.models.common import HabitStatus
from app.models.habit import HabitTarget


class UserHabitState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    state_id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    user_id: str = Field(min_length=1)
    habit_id: str = Field(min_length=1)

    status: HabitStatus = HabitStatus.ACTIVE

    current_level: int = Field(ge=1)
    current_target: HabitTarget

    assigned_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    started_at: datetime | None = None
    last_activity_at: datetime | None = None

    total_sessions: int = Field(default=0, ge=0)
    completed_sessions: int = Field(default=0, ge=0)

    progression_paused: bool = False

    @classmethod
    def from_habit(
        cls,
        user_id: str,
        habit,
        metric: TargetMetric | None = None,
    ) -> "UserHabitState":

        profile = next(
            (
                profile
                for profile in habit.progression_profiles
                if metric is None or profile.metric == metric
            ),
            None,
        )

        if profile is None:
            raise ValueError(
                f"Habit '{habit.habit_id}' does not support "
                f"the '{metric.value}' metric"
            )

        starting_level = next(
            level
            for level in profile.levels
            if level.level == profile.starting_level
        )

        return cls(
            user_id=user_id,
            habit_id=habit.habit_id,
            current_level=starting_level.level,
            current_target=starting_level.target,
        )
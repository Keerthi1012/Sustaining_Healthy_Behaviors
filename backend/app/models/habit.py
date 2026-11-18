
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.common import (
    COMBComponent,
    HealthDomain,
    FeedbackDifficulty,
    TrackingMethod,
    TargetMetric,
)


class HabitTarget(BaseModel):
    model_config = ConfigDict(extra="forbid")

    metric: TargetMetric
    value: float = Field(gt=0)


class HabitLevel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    level: int = Field(ge=1)
    name: str = Field(min_length=1, max_length=50)
    target: HabitTarget

class MetricProgressionProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    metric: TargetMetric
    levels: list[HabitLevel] = Field(min_length=1)
    starting_level: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_levels(self):
        level_numbers = [level.level for level in self.levels]

        if len(level_numbers) != len(set(level_numbers)):
            raise ValueError("Profile levels must have unique numbers")

        if self.starting_level not in level_numbers:
            raise ValueError(
                "Starting level must exist in the profile levels"
            )

        for level in self.levels:
            if level.target.metric != self.metric:
                raise ValueError(
                    "All level targets must use the profile metric"
                )

        return self

class HabitBCTMapping(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bct_id: str = Field(pattern=r"^\d+\.\d+$")

    implementation: str = Field(
        min_length=1,
        max_length=300,
    )

    delivery_method: str = Field(
        min_length=1,
        max_length=50,
    )

class ProgressionPolicy(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool = True
    strategy: str = "feedback_gated"
    lookback_sessions: int = Field(default=5, ge=1)
    min_successful_sessions: int = Field(default=2, ge=1)
    required_feedback: list[FeedbackDifficulty] = Field(
        default_factory=lambda: [
            FeedbackDifficulty.EASY,
            FeedbackDifficulty.COMFORTABLE,
        ]
    )


class Habit(BaseModel):
    model_config = ConfigDict(extra="forbid")

    habit_id: str = Field(min_length=1)
    domain: HealthDomain

    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=300)

    progression_profiles: list[MetricProgressionProfile] = Field(
        min_length=1
    )

    com_b_components: list[COMBComponent] = Field(
        default_factory=list
    )
    bct_mappings: list[HabitBCTMapping] = Field(
        default_factory=list
    )

    tracking_methods: list[TrackingMethod] = Field(
        default_factory=lambda: [TrackingMethod.MANUAL]
    )

    progression: ProgressionPolicy = Field(
        default_factory=ProgressionPolicy
    )

    safety_considerations: list[str] = Field(
        default_factory=list
    )

    clinical_basis: str | None = Field(default=None, max_length=600)
    limits: str | None = Field(default=None, max_length=400)

    active: bool = True

    @model_validator(mode="after")
    def validate_habit(self):
        metrics = [
            profile.metric
            for profile in self.progression_profiles
        ]

        if len(metrics) != len(set(metrics)):
            raise ValueError(
                "A habit cannot have duplicate metric profiles"
            )

        if self.progression.min_successful_sessions > (
            self.progression.lookback_sessions
        ):
            raise ValueError(
                "Minimum successful sessions cannot exceed lookback sessions"
            )

        bct_ids = [
            mapping.bct_id
            for mapping in self.bct_mappings
        ]

        if len(bct_ids) != len(set(bct_ids)):
            raise ValueError(
                "A habit cannot contain duplicate BCT mappings"
            )

        return self
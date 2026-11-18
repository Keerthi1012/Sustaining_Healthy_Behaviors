
from enum import Enum

from pydantic import BaseModel, ConfigDict

from app.models.common import (
    FeedbackDifficulty,
    HabitStatus,
)
from app.models.feedback import HabitFeedback
from app.models.habit import Habit
from app.models.user_habit import UserHabitState
from app.models.common import SafetySignal


class ProgressionAction(str, Enum):
    INCREASE = "increase"
    MAINTAIN = "maintain"
    DECREASE = "decrease"
    SAFETY_PAUSE = "safety_pause"


class ProgressionReasonCode(str, Enum):
    PROGRESSION_DISABLED = "progression_disabled"
    HIGHEST_LEVEL = "highest_level"
    SAFETY_CONCERN = "safety_concern"
    UNCOMFORTABLE = "uncomfortable"
    LOWEST_LEVEL = "lowest_level"
    INSUFFICIENT_SESSIONS = "insufficient_sessions"
    CRITERIA_MET = "criteria_met"


class ProgressionDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: ProgressionAction
    reason_code: ProgressionReasonCode
    reason: str

    current_level: int
    recommended_level: int

    current_target: float
    recommended_target: float


def evaluate_progression(
    state: UserHabitState,
    habit: Habit,
    feedback_history: list[HabitFeedback],
) -> ProgressionDecision:
    """
    Evaluate recent feedback and recommend the next
    progression level. Does not modify the user state.
    """

    if state.habit_id != habit.habit_id:
        raise ValueError(
            "Habit does not match the user's habit state"
        )

    if state.status != HabitStatus.ACTIVE:
        raise ValueError("Habit is not active")

    if not habit.progression.enabled or state.progression_paused:
        return _decision(
            state,
            ProgressionAction.MAINTAIN,
            ProgressionReasonCode.PROGRESSION_DISABLED,
            "Progression is disabled or paused.",
        )

    for feedback in feedback_history:
        if feedback.user_habit_state_id != state.state_id:
            raise ValueError(
                "Feedback history contains another user's habit"
            )

    profile = next(
        (
            item
            for item in habit.progression_profiles
            if item.metric == state.current_target.metric
        ),
        None,
    )

    if profile is None:
        raise ValueError(
            "No progression profile matches the current target"
        )

    current_level = next(
        (
            level
            for level in profile.levels
            if level.level == state.current_level
        ),
        None,
    )

    if current_level is None:
        raise ValueError("Current level does not exist in profile")

    levels = sorted(profile.levels, key=lambda item: item.level)

    next_level = next(
        (
            level
            for level in levels
            if level.level > state.current_level
        ),
        None,
    )

    if next_level is None:
        return _decision(
            state,
            ProgressionAction.MAINTAIN,
            ProgressionReasonCode.HIGHEST_LEVEL,
            "The user is already at the highest level.",
        )

    recent = sorted(
        feedback_history,
        key=lambda item: item.recorded_at,
        reverse=True,
    )[:habit.progression.lookback_sessions]

    # Safety concerns take priority over normal progression decisions.
    if any(
        item.safety_signal != SafetySignal.NONE
        for item in recent
    ):
        return _decision(
            state,
            ProgressionAction.SAFETY_PAUSE,
            ProgressionReasonCode.SAFETY_CONCERN,
            "A safety concern was reported. Pause the activity and review before resuming.",
        )
    if (
        recent
        and recent[0].difficulty == FeedbackDifficulty.UNCOMFORTABLE
    ):
        previous_level = next(
            (
                level
                for level in reversed(levels)
                if level.level < state.current_level
            ),
            None,
        )

        if previous_level is None:
            return _decision(
                state,
                ProgressionAction.MAINTAIN,
                ProgressionReasonCode.LOWEST_LEVEL,
                "Already at the lowest level. Reassess the activity before continuing.",
            )

        return ProgressionDecision(
            action=ProgressionAction.DECREASE,
            reason_code=ProgressionReasonCode.UNCOMFORTABLE,
            reason="User reported uncomfortable difficulty. Returning to an easier level.",
            current_level=state.current_level,
            recommended_level=previous_level.level,
            current_target=state.current_target.value,
            recommended_target=previous_level.target.value,
        )

    successful_sessions = sum(
        1
        for item in recent
        if (
            item.completed
            and item.difficulty
            in habit.progression.required_feedback
        )
    )

    if successful_sessions < habit.progression.min_successful_sessions:
        return _decision(
            state,
            ProgressionAction.MAINTAIN,
            ProgressionReasonCode.INSUFFICIENT_SESSIONS,
            "Not enough successful sessions to progress.",
        )

    return ProgressionDecision(
        action=ProgressionAction.INCREASE,
        reason_code=ProgressionReasonCode.CRITERIA_MET,
        reason="The user met the progression criteria.",
        current_level=state.current_level,
        recommended_level=next_level.level,
        current_target=state.current_target.value,
        recommended_target=next_level.target.value,
    )


def _decision(
    state: UserHabitState,
    action: ProgressionAction,
    reason_code: ProgressionReasonCode,
    reason: str,
) -> ProgressionDecision:
    return ProgressionDecision(
        action=action,
        reason_code=reason_code,
        reason=reason,
        current_level=state.current_level,
        recommended_level=state.current_level,
        current_target=state.current_target.value,
        recommended_target=state.current_target.value,
    )

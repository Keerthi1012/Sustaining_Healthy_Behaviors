from app.models.common import HabitStatus
from app.models.user_habit import UserHabitState
from app.services.progression_service import (
    ProgressionAction,
    ProgressionDecision,
)


def apply_progression_decision(
    state: UserHabitState,
    decision: ProgressionDecision,
) -> UserHabitState:

    if state.current_level != decision.current_level:
        raise ValueError(
            "Progression decision does not match the current habit level"
        )
    if state.current_target.value != decision.current_target:
        raise ValueError("Progression decision does not match the current habit target")

    if decision.action == ProgressionAction.SAFETY_PAUSE:
        return state.model_copy(
            update={
                "status": HabitStatus.PAUSED,
                "progression_paused": True,
            }
        )

    if decision.action in (
        ProgressionAction.INCREASE,
        ProgressionAction.DECREASE,
    ):
        updated_target = state.current_target.model_copy(
            update={"value": decision.recommended_target}
        )

        return state.model_copy(
            update={
                "current_level": decision.recommended_level,
                "current_target": updated_target,
            }
        )

    return state
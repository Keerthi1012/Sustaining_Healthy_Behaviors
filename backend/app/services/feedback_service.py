
from app.models.common import HabitStatus
from app.models.feedback import HabitFeedback
from app.models.user_habit import UserHabitState


def record_feedback(
    state: UserHabitState,
    feedback: HabitFeedback,
) -> UserHabitState:
    """
    Apply a user's feedback to their individual habit state.

    Returns an updated state. The caller is responsible
    for saving both the feedback and updated state.
    """

    if feedback.user_habit_state_id != state.state_id:
        raise ValueError(
            "Feedback does not belong to this user habit state"
        )

    if state.status != HabitStatus.ACTIVE:
        raise ValueError(
            "Feedback can only be recorded for an active habit"
        )

    return state.model_copy(
        update={
            "total_sessions": state.total_sessions + 1,
            "completed_sessions": (
                state.completed_sessions + int(feedback.completed)
            ),
            "started_at": state.started_at or feedback.recorded_at,
            "last_activity_at": feedback.recorded_at,
        }
    )

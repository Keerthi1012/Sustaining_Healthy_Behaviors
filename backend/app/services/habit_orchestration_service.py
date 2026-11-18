from dataclasses import dataclass

from app.models.feedback import HabitFeedback
from app.models.habit import Habit
from app.models.user_habit import UserHabitState
from app.repositories.interfaces import UserHabitRepository
from app.services.feedback_service import record_feedback
from app.services.progression_service import (
    ProgressionDecision,
    evaluate_progression,
)
from app.services.habit_lifecycle_service import (
    apply_progression_decision,
)


@dataclass(frozen=True)
class HabitFeedbackResult:
    state: UserHabitState
    decision: ProgressionDecision


def process_habit_feedback(
    repository: UserHabitRepository,
    habit: Habit,
    feedback: HabitFeedback,
) -> HabitFeedbackResult:

    # 1. Retrieve the user's assigned habit.
    state = repository.get_state(feedback.user_habit_state_id)

    # 2. Retrieve previous feedback.
    history = repository.get_feedback_history(state.state_id)

    # 3. Reject duplicate feedback before processing.
    if any(
        item.feedback_id == feedback.feedback_id
        for item in history
    ):
        raise ValueError("Feedback has already been recorded")

    # 4. Update session counts and activity timestamps.
    updated_state = record_feedback(state, feedback)

    # 5. Include the new feedback in progression evaluation.
    complete_history = history + [feedback]

    decision = evaluate_progression(
        updated_state,
        habit,
        complete_history,
    )

    # 6. Apply the progression recommendation.
    final_state = apply_progression_decision(
        updated_state,
        decision,
    )

    # 7. Save both together.
    repository.save_feedback_and_state(
        feedback,
        final_state,
    )

    return HabitFeedbackResult(
        state=final_state,
        decision=decision,
    )
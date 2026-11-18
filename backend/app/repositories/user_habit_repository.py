from app.models.feedback import HabitFeedback
from app.models.user_habit import UserHabitState


class InMemoryUserHabitRepository:
    def __init__(self):
        self._states: dict[str, UserHabitState] = {}
        self._feedback: dict[str, list[HabitFeedback]] = {}
        self._feedback_ids: set[str] = set()

    def add_state(self, state: UserHabitState) -> None:
        if state.state_id in self._states:
            raise ValueError("User habit state already exists")

        if self.get_state_by_user_habit(
            state.user_id,
            state.habit_id,
        ):
            raise ValueError(
                "A state already exists for this user and habit"
            )

        self._states[state.state_id] = state.model_copy(deep=True)
        self._feedback[state.state_id] = []

    def get_state(self, state_id: str) -> UserHabitState:
        if state_id not in self._states:
            raise KeyError(f"User habit state not found: {state_id}")

        return self._states[state_id].model_copy(deep=True)

    def get_state_by_user_habit(
        self,
        user_id: str,
        habit_id: str,
    ) -> UserHabitState | None:
        for state in self._states.values():
            if (
                state.user_id == user_id
                and state.habit_id == habit_id
            ):
                return state.model_copy(deep=True)

        return None

    def get_feedback_history(
        self,
        state_id: str,
    ) -> list[HabitFeedback]:
        if state_id not in self._states:
            raise KeyError(f"User habit state not found: {state_id}")

        return [
            item.model_copy(deep=True)
            for item in self._feedback[state_id]
        ]

    def save_feedback_and_state(
        self,
        feedback: HabitFeedback,
        updated_state: UserHabitState,
    ) -> None:
        state_id = feedback.user_habit_state_id

        if state_id not in self._states:
            raise KeyError(f"User habit state not found: {state_id}")

        if updated_state.state_id != state_id:
            raise ValueError(
                "Updated state does not match feedback state"
            )

        if feedback.feedback_id in self._feedback_ids:
            raise ValueError("Feedback has already been recorded")

        # Validate everything before changing either collection.
        self._feedback[state_id].append(
            feedback.model_copy(deep=True)
        )
        self._states[state_id] = updated_state.model_copy(deep=True)
        self._feedback_ids.add(feedback.feedback_id)
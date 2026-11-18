import json
import unittest
from pathlib import Path

from app.models.common import (
    FeedbackDifficulty,
    HabitStatus,
    SafetySignal,
    TargetMetric,
)
from app.models.feedback import HabitFeedback
from app.models.habit import Habit
from app.models.user_habit import UserHabitState
from app.repositories.user_habit_repository import (
    InMemoryUserHabitRepository,
)
from app.services.habit_orchestration_service import (
    process_habit_feedback,
)
from app.services.progression_service import ProgressionAction


class TestHabitOrchestrationService(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        library_path = (
            Path(__file__).resolve().parents[1]
            / "app"
            / "data"
            / "habit_library"
            / "movement.json"
        )

        data = json.loads(
            library_path.read_text(encoding="utf-8")
        )

        cls.habit = Habit.model_validate(data["habits"][0])

    def setUp(self):
        self.repository = InMemoryUserHabitRepository()

        self.state = UserHabitState.from_habit(
            "user_001",
            self.habit,
            metric=TargetMetric.DURATION_MINUTES,
        )

        self.repository.add_state(self.state)

    def create_feedback(
        self,
        completed=True,
        difficulty=FeedbackDifficulty.EASY,
        safety_signal=SafetySignal.NONE,
    ):
        return HabitFeedback(
            user_habit_state_id=self.state.state_id,
            completed=completed,
            difficulty=difficulty,
            safety_signal=safety_signal,
        )

    def test_01_two_successful_walks_trigger_progression(self):
        decisions = []

        for _ in range(2):
            feedback = self.create_feedback()

            result = process_habit_feedback(
                self.repository,
                self.habit,
                feedback,
            )

            decisions.append(result.decision.action)

        final_state = self.repository.get_state(
            self.state.state_id
        )

        history = self.repository.get_feedback_history(
            self.state.state_id
        )

        self.assertEqual(
            decisions,
            [
                ProgressionAction.MAINTAIN,
                ProgressionAction.INCREASE,
            ],
        )

        self.assertEqual(final_state.current_level, 2)
        self.assertEqual(final_state.current_target.value, 7)
        self.assertEqual(final_state.total_sessions, 2)
        self.assertEqual(final_state.completed_sessions, 2)
        self.assertEqual(len(history), 2)

    def test_02_difficult_feedback_does_not_progress(self):
        feedback = self.create_feedback(
            completed=True,
            difficulty=FeedbackDifficulty.DIFFICULT,
        )

        result = process_habit_feedback(
            self.repository,
            self.habit,
            feedback,
        )

        self.assertEqual(
            result.decision.action,
            ProgressionAction.MAINTAIN,
        )
        self.assertEqual(result.state.current_level, 1)
        self.assertEqual(result.state.current_target.value, 5)

    def test_03_safety_concern_pauses_habit(self):
        profile = self.habit.progression_profiles[0]
        level_two = next(
            level for level in profile.levels
            if level.level == 2
        )

        level_two_state = self.state.model_copy(
            update={
                "current_level": 2,
                "current_target": level_two.target,
            }
        )

        repository = InMemoryUserHabitRepository()
        repository.add_state(level_two_state)

        feedback = HabitFeedback(
            user_habit_state_id=level_two_state.state_id,
            completed=False,
            difficulty=FeedbackDifficulty.UNCOMFORTABLE,
            safety_signal=SafetySignal.PAIN,
        )

        result = process_habit_feedback(
            repository,
            self.habit,
            feedback,
        )

        saved_state = repository.get_state(
            level_two_state.state_id
        )

        self.assertEqual(
            result.decision.action,
            ProgressionAction.SAFETY_PAUSE,
        )
        self.assertEqual(saved_state.status, HabitStatus.PAUSED)
        self.assertTrue(saved_state.progression_paused)
        self.assertEqual(saved_state.current_level, 2)
        self.assertEqual(saved_state.current_target.value, 7)

    def test_04_duplicate_feedback_is_rejected(self):
        feedback = self.create_feedback()

        process_habit_feedback(
            self.repository,
            self.habit,
            feedback,
        )

        with self.assertRaises(ValueError):
            process_habit_feedback(
                self.repository,
                self.habit,
                feedback,
            )

        saved_state = self.repository.get_state(
            self.state.state_id
        )

        history = self.repository.get_feedback_history(
            self.state.state_id
        )

        self.assertEqual(saved_state.total_sessions, 1)
        self.assertEqual(saved_state.completed_sessions, 1)
        self.assertEqual(len(history), 1)

    def test_05_paused_habit_rejects_new_feedback(self):
        safety_feedback = self.create_feedback(
            completed=False,
            difficulty=FeedbackDifficulty.UNCOMFORTABLE,
            safety_signal=SafetySignal.PAIN,
        )

        process_habit_feedback(
            self.repository,
            self.habit,
            safety_feedback,
        )

        follow_up_feedback = self.create_feedback()

        with self.assertRaises(ValueError):
            process_habit_feedback(
                self.repository,
                self.habit,
                follow_up_feedback,
            )

        saved_state = self.repository.get_state(
            self.state.state_id
        )

        history = self.repository.get_feedback_history(
            self.state.state_id
        )

        self.assertEqual(saved_state.status, HabitStatus.PAUSED)
        self.assertEqual(saved_state.total_sessions, 1)
        self.assertEqual(len(history), 1)
if __name__ == "__main__":
    unittest.main()
import unittest

from app.models.common import FeedbackDifficulty, TargetMetric
from app.models.feedback import HabitFeedback
from app.models.habit import HabitTarget
from app.models.user_habit import UserHabitState
from app.repositories.user_habit_repository import (
    InMemoryUserHabitRepository,
)


class TestInMemoryUserHabitRepository(unittest.TestCase):

    def setUp(self):
        self.repository = InMemoryUserHabitRepository()

        self.state = UserHabitState(
            user_id="user_001",
            habit_id="movement_walking_001",
            current_level=1,
            current_target=HabitTarget(
                metric=TargetMetric.DURATION_MINUTES,
                value=5,
            ),
        )

        self.repository.add_state(self.state)

    def create_feedback(self):
        return HabitFeedback(
            user_habit_state_id=self.state.state_id,
            completed=True,
            difficulty=FeedbackDifficulty.EASY,
        )

    def test_01_add_and_get_state(self):
        retrieved = self.repository.get_state(self.state.state_id)

        self.assertEqual(retrieved.state_id, self.state.state_id)
        self.assertEqual(retrieved.current_target.value, 5)

    def test_02_reject_duplicate_state(self):
        with self.assertRaises(ValueError):
            self.repository.add_state(self.state)

    def test_03_save_feedback_and_updated_state(self):
        feedback = self.create_feedback()

        updated_state = self.state.model_copy(
            update={
                "total_sessions": 1,
                "completed_sessions": 1,
            }
        )

        self.repository.save_feedback_and_state(
            feedback,
            updated_state,
        )

        saved_state = self.repository.get_state(self.state.state_id)
        history = self.repository.get_feedback_history(
            self.state.state_id
        )

        self.assertEqual(saved_state.total_sessions, 1)
        self.assertEqual(saved_state.completed_sessions, 1)
        self.assertEqual(len(history), 1)

    def test_04_reject_duplicate_feedback(self):
        feedback = self.create_feedback()

        updated_state = self.state.model_copy(
            update={"total_sessions": 1}
        )

        self.repository.save_feedback_and_state(
            feedback,
            updated_state,
        )

        with self.assertRaises(ValueError):
            self.repository.save_feedback_and_state(
                feedback,
                updated_state,
            )

        saved_state = self.repository.get_state(self.state.state_id)
        history = self.repository.get_feedback_history(
            self.state.state_id
        )

        self.assertEqual(saved_state.total_sessions, 1)
        self.assertEqual(len(history), 1)


if __name__ == "__main__":
    unittest.main()
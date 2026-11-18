
import json
import unittest
from pathlib import Path

from app.models.common import (
    FeedbackDifficulty,
    TargetMetric,
    SafetySignal
)
from app.models.feedback import HabitFeedback
from app.models.habit import Habit
from app.models.user_habit import UserHabitState
from app.services.progression_service import (
    ProgressionAction,
    evaluate_progression,
)


class TestWalkingProgression(unittest.TestCase):

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

    def create_state(self, level=1):
        profile = self.habit.progression_profiles[0]

        selected_level = next(
            item for item in profile.levels
            if item.level == level
        )

        return UserHabitState(
            user_id="user_001",
            habit_id=self.habit.habit_id,
            current_level=level,
            current_target=selected_level.target,
        )

    def create_feedback(
        self,
        state,
        completed=True,
        difficulty=FeedbackDifficulty.COMFORTABLE,
        safety_signal=SafetySignal.NONE,
    ):
        return HabitFeedback(
            user_habit_state_id=state.state_id,
            completed=completed,
            difficulty=difficulty,
            safety_signal=safety_signal,
        )
    def evaluate(self, state, feedback_items):
        return evaluate_progression(
            state,
            self.habit,
            feedback_items,
        )

    def test_01_successful_progression(self):
        state = self.create_state(level=1)

        feedback = [
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
            self.create_feedback(state, True, FeedbackDifficulty.COMFORTABLE),
            self.create_feedback(state, False, FeedbackDifficulty.DIFFICULT),
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
            self.create_feedback(state, True, FeedbackDifficulty.COMFORTABLE),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(decision.action, ProgressionAction.INCREASE)
        self.assertEqual(decision.recommended_level, 2)
        self.assertEqual(decision.recommended_target, 7)

    def test_02_insufficient_success(self):
        state = self.create_state(level=1)

        feedback = [
            self.create_feedback(state, True, FeedbackDifficulty.COMFORTABLE),
            self.create_feedback(state, False, FeedbackDifficulty.DIFFICULT),
            self.create_feedback(state, False, FeedbackDifficulty.DIFFICULT),
            self.create_feedback(state, False, FeedbackDifficulty.DIFFICULT),
            self.create_feedback(state, False, FeedbackDifficulty.DIFFICULT),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(decision.action, ProgressionAction.MAINTAIN)
        self.assertEqual(decision.recommended_level, 1)

    def test_02b_progression_threshold_is_two_sessions(self):
        state = self.create_state(level=1)

        feedback = [
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
            self.create_feedback(state, True, FeedbackDifficulty.COMFORTABLE),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(decision.action, ProgressionAction.INCREASE)
        self.assertEqual(decision.recommended_level, 2)

    def test_03_difficult_feedback(self):
        state = self.create_state(level=1)

        feedback = [
            self.create_feedback(state, True, FeedbackDifficulty.DIFFICULT),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(decision.action, ProgressionAction.MAINTAIN)
        self.assertEqual(decision.recommended_level, 1)

    def test_04_uncomfortable_at_level_two(self):
        state = self.create_state(level=2)

        feedback = [
            self.create_feedback(
                state,
                True,
                FeedbackDifficulty.UNCOMFORTABLE,
            ),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(decision.action.value, "decrease")
        self.assertEqual(decision.recommended_level, 1)
        self.assertEqual(decision.recommended_target, 5)

    def test_05_uncomfortable_at_lowest_level(self):
        state = self.create_state(level=1)

        feedback = [
            self.create_feedback(
                state,
                True,
                FeedbackDifficulty.UNCOMFORTABLE,
            ),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(decision.action.value, "maintain")
        self.assertEqual(decision.recommended_level, 1)

    def test_06_safety_concern(self):
        state = self.create_state(level=2)

        feedback = [
            self.create_feedback(
                state,
                completed=False,
                difficulty=FeedbackDifficulty.UNCOMFORTABLE,
                safety_signal=SafetySignal.PAIN,
            ),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(
            decision.action,
            ProgressionAction.SAFETY_PAUSE,
        )
        self.assertEqual(decision.recommended_level, 2)

    def test_07_highest_level(self):
        state = self.create_state(level=4)

        feedback = [
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
            self.create_feedback(state, True, FeedbackDifficulty.EASY),
        ]

        decision = self.evaluate(state, feedback)

        self.assertEqual(decision.action, ProgressionAction.MAINTAIN)
        self.assertEqual(decision.recommended_level, 4)
    def test_08_edge_case(self):
            state = self.create_state(level=2)
    
            feedback = [
                self.create_feedback(state, True, FeedbackDifficulty.UNCOMFORTABLE),
                self.create_feedback(state, True, FeedbackDifficulty.COMFORTABLE),
                self.create_feedback(state, True, FeedbackDifficulty.COMFORTABLE),
                self.create_feedback(state, True, FeedbackDifficulty.COMFORTABLE),
            ]
    
            decision = self.evaluate(state, feedback)
    
            self.assertEqual(decision.action, ProgressionAction.INCREASE)
            self.assertEqual(decision.recommended_level, 3)

if __name__ == "__main__":
    unittest.main()

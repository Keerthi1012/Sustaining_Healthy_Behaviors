import unittest

from app.models.common import (
    HabitStatus,
    TargetMetric,
)
from app.models.habit import HabitTarget
from app.models.user_habit import UserHabitState
from app.services.progression_service import (
    ProgressionAction,
    ProgressionDecision,
    ProgressionReasonCode,
)
from app.services.habit_lifecycle_service import (
    apply_progression_decision,
)


class TestHabitLifecycleService(unittest.TestCase):

    def create_state(self, level=2, target=7):
        return UserHabitState(
            user_id="user_001",
            habit_id="movement_walking_001",
            current_level=level,
            current_target=HabitTarget(
                metric=TargetMetric.DURATION_MINUTES,
                value=target,
            ),
        )

    def create_decision(
        self,
        action,
        current_level=2,
        recommended_level=2,
        current_target=7,
        recommended_target=7,
    ):
        return ProgressionDecision(
            action=action,
            reason_code=ProgressionReasonCode.CRITERIA_MET,
            reason="Test progression decision",
            current_level=current_level,
            recommended_level=recommended_level,
            current_target=current_target,
            recommended_target=recommended_target,
        )

    def test_01_increase_level(self):
        state = self.create_state(level=1, target=5)

        decision = self.create_decision(
            ProgressionAction.INCREASE,
            current_level=1,
            recommended_level=2,
            current_target=5,
            recommended_target=7,
        )

        updated_state = apply_progression_decision(state, decision)

        self.assertEqual(updated_state.current_level, 2)
        self.assertEqual(updated_state.current_target.value, 7)
        self.assertEqual(updated_state.status, HabitStatus.ACTIVE)

    def test_02_decrease_level(self):
        state = self.create_state(level=2, target=7)

        decision = self.create_decision(
            ProgressionAction.DECREASE,
            current_level=2,
            recommended_level=1,
            current_target=7,
            recommended_target=5,
        )

        updated_state = apply_progression_decision(state, decision)

        self.assertEqual(updated_state.current_level, 1)
        self.assertEqual(updated_state.current_target.value, 5)
        self.assertEqual(updated_state.status, HabitStatus.ACTIVE)

    def test_03_maintain_level(self):
        state = self.create_state(level=2, target=7)

        decision = self.create_decision(
            ProgressionAction.MAINTAIN,
            current_level=2,
            recommended_level=2,
            current_target=7,
            recommended_target=7,
        )

        updated_state = apply_progression_decision(state, decision)

        self.assertEqual(updated_state.current_level, 2)
        self.assertEqual(updated_state.current_target.value, 7)
        self.assertEqual(updated_state.status, HabitStatus.ACTIVE)

    def test_04_safety_pause(self):
        state = self.create_state(level=2, target=7)

        decision = self.create_decision(
            ProgressionAction.SAFETY_PAUSE,
            current_level=2,
            recommended_level=2,
            current_target=7,
            recommended_target=7,
        )

        updated_state = apply_progression_decision(state, decision)

        self.assertEqual(updated_state.status, HabitStatus.PAUSED)
        self.assertTrue(updated_state.progression_paused)
        self.assertEqual(updated_state.current_level, 2)
        self.assertEqual(updated_state.current_target.value, 7)

    def test_05_reject_stale_decision(self):
        state = self.create_state(level=2, target=7)

        decision = self.create_decision(
            ProgressionAction.INCREASE,
            current_level=1,
            recommended_level=2,
            current_target=5,
            recommended_target=7,
        )

        with self.assertRaises(ValueError):
            apply_progression_decision(state, decision)
    def test_06_reject_stale_target(self):
        state = self.create_state(level=2, target=8)

        decision = self.create_decision(
            ProgressionAction.INCREASE,
            current_level=2,
            recommended_level=3,
            current_target=7,
            recommended_target=10,
        )

        with self.assertRaises(ValueError):
            apply_progression_decision(state, decision)

if __name__ == "__main__":
    unittest.main()
import unittest

from pydantic import ValidationError

from app.models.activity import ActivityObservation
from app.models.common import (
    ActivityIntensity,
    ActivitySource,
    ActivityType,
)


class TestActivityObservation(unittest.TestCase):

    def test_01_manual_walking_observation(self):
        observation = ActivityObservation(
            user_id="user_001",
            activity_type=ActivityType.WALKING,
            source=ActivitySource.MANUAL,
            duration_minutes=10,
        )

        self.assertEqual(observation.duration_minutes, 10)
        self.assertEqual(
            observation.intensity,
            ActivityIntensity.UNKNOWN,
        )
        self.assertIsNone(observation.user_habit_state_id)

    def test_02_wearable_observation(self):
        observation = ActivityObservation(
            user_id="user_001",
            activity_type=ActivityType.WALKING,
            source=ActivitySource.WEARABLE,
            duration_minutes=10,
            steps=1200,
            distance_meters=850,
            intensity=ActivityIntensity.MODERATE,
            source_event_id="watch_event_001",
        )

        self.assertEqual(observation.steps, 1200)
        self.assertEqual(observation.source_event_id, "watch_event_001")

    def test_03_measurement_is_required(self):
        with self.assertRaises(ValidationError):
            ActivityObservation(
                user_id="user_001",
                activity_type=ActivityType.WALKING,
                source=ActivitySource.MOBILE_SENSOR,
            )

    def test_04_invalid_extra_field_is_rejected(self):
        with self.assertRaises(ValidationError):
            ActivityObservation(
                user_id="user_001",
                activity_type=ActivityType.WALKING,
                source=ActivitySource.MANUAL,
                duration_minutes=10,
                calories=100,
            )


if __name__ == "__main__":
    unittest.main()
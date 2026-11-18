
import unittest
from datetime import datetime, timezone

from app.models.activity import ActivityObservation
from app.models.common import (
    ActivityIntensity,
    ActivitySource,
    ActivityType,
    
)
from app.services.activity_aggregation_service import (
    aggregate_activity_duration,
    aggregate_activity_intensity
)


class TestActivityAggregationService(unittest.TestCase):

    def setUp(self):
        self.user_id = "user_001"

        self.period_start = datetime(
            2026, 11, 9, 0, 0, tzinfo=timezone.utc
        )
        self.period_end = datetime(
            2026, 11, 16, 0, 0, tzinfo=timezone.utc
        )

    def create_observation(
        self,
        start_hour,
        duration,
        user_id="user_001",
        activity_type=ActivityType.WALKING,
        source=ActivitySource.MANUAL,
        intensity=ActivityIntensity.UNKNOWN,
    ):
        return ActivityObservation(
            user_id=user_id,
            activity_type=activity_type,
            source=source,
            started_at=datetime(
                2026, 11, 10, start_hour, 0,
                tzinfo=timezone.utc,
            ),
            duration_minutes=duration,
            intensity=intensity,
        )

    def aggregate(self, observations):
        return aggregate_activity_duration(
            user_id=self.user_id,
            observations=observations,
            period_start=self.period_start,
            period_end=self.period_end,
        )

    def test_01_non_overlapping_activities(self):
        observations = [
            self.create_observation(8, 10),
            self.create_observation(9, 15),
        ]

        self.assertEqual(self.aggregate(observations), 25)

    def test_02_fully_overlapping_activities(self):
        observations = [
            self.create_observation(8, 10),
            self.create_observation(8, 15),
        ]

        self.assertEqual(self.aggregate(observations), 15)

    def test_03_partially_overlapping_activities(self):
        observations = [
            self.create_observation(8, 10),
            self.create_observation(8, 10),
        ]

        observations[1] = observations[1].model_copy(
            update={
                "started_at": datetime(
                    2026, 11, 10, 8, 5,
                    tzinfo=timezone.utc,
                )
            }
        )

        self.assertEqual(self.aggregate(observations), 15)

    def test_04_contained_interval(self):
        observations = [
            self.create_observation(8, 15),
            self.create_observation(8, 5),
        ]

        observations[1] = observations[1].model_copy(
            update={
                "started_at": datetime(
                    2026, 11, 10, 8, 5,
                    tzinfo=timezone.utc,
                )
            }
        )

        self.assertEqual(self.aggregate(observations), 15)

    def test_05_different_activity_types_are_not_double_counted(self):
        observations = [
            self.create_observation(
                8, 15,
                activity_type=ActivityType.WALKING,
            ),
            self.create_observation(
                8, 10,
                activity_type=ActivityType.CYCLING,
            ),
        ]

        self.assertEqual(self.aggregate(observations), 15)

    def test_06_different_users_are_excluded(self):
        observations = [
            self.create_observation(8, 10, user_id="user_001"),
            self.create_observation(9, 20, user_id="user_002"),
        ]

        self.assertEqual(self.aggregate(observations), 10)

    def test_07_activity_is_clipped_to_period_boundaries(self):
        observation = ActivityObservation(
            user_id=self.user_id,
            activity_type=ActivityType.WALKING,
            source=ActivitySource.MANUAL,
            started_at=datetime(
                2026, 11, 8, 23, 55,
                tzinfo=timezone.utc,
            ),
            duration_minutes=15,
        )

        self.assertEqual(self.aggregate([observation]), 10)

    def test_08_step_only_observation_is_excluded(self):
        observation = ActivityObservation(
            user_id=self.user_id,
            activity_type=ActivityType.WALKING,
            source=ActivitySource.MOBILE_SENSOR,
            steps=1000,
        )

        self.assertEqual(self.aggregate([observation]), 0)

    def test_09_empty_activity_history(self):
        self.assertEqual(self.aggregate([]), 0)

class TestActivityIntensityAggregation(unittest.TestCase):

    def setUp(self):
        self.period_start = datetime(
            2026, 11, 9, 0, 0, tzinfo=timezone.utc
        )
        self.period_end = datetime(
            2026, 11, 16, 0, 0, tzinfo=timezone.utc
        )

    def create_observation(self, start_minute, duration, intensity):
        start = datetime(
            2026, 11, 10, 8, 0, tzinfo=timezone.utc
        )

        from datetime import timedelta
        start += timedelta(minutes=start_minute)

        return ActivityObservation(
            user_id="user_001",
            activity_type=ActivityType.WALKING,
            source=ActivitySource.WEARABLE,
            started_at=start,
            duration_minutes=duration,
            intensity=intensity,
        )

    def aggregate(self, observations):
        return aggregate_activity_intensity(
            user_id="user_001",
            observations=observations,
            period_start=self.period_start,
            period_end=self.period_end,
        )

    def test_01_agreed_moderate_intensity(self):
        observations = [
            self.create_observation(
                0, 10, ActivityIntensity.MODERATE
            ),
            self.create_observation(
                0, 15, ActivityIntensity.MODERATE
            ),
        ]

        result = self.aggregate(observations)

        self.assertEqual(result.moderate_minutes, 15)
        self.assertEqual(result.conflicted_minutes, 0)

    def test_02_agreed_vigorous_intensity(self):
        observations = [
            self.create_observation(
                0, 10, ActivityIntensity.VIGOROUS
            ),
            self.create_observation(
                0, 15, ActivityIntensity.VIGOROUS
            ),
        ]

        result = self.aggregate(observations)

        self.assertEqual(result.vigorous_minutes, 15)
        self.assertEqual(result.conflicted_minutes, 0)

    def test_03_different_intensities_create_conflict(self):
        observations = [
            self.create_observation(
                0, 10, ActivityIntensity.MODERATE
            ),
            self.create_observation(
                0, 15, ActivityIntensity.VIGOROUS
            ),
        ]

        result = self.aggregate(observations)

        self.assertEqual(result.conflicted_minutes, 10)
        self.assertEqual(result.moderate_minutes, 0)
        self.assertEqual(result.vigorous_minutes, 5)
    def test_04_unknown_and_moderate_create_conflict(self):
        observations = [
            self.create_observation(
                0, 10, ActivityIntensity.UNKNOWN
            ),
            self.create_observation(
                0, 15, ActivityIntensity.MODERATE
            ),
        ]

        result = self.aggregate(observations)

        self.assertEqual(result.conflicted_minutes, 10)
        self.assertEqual(result.moderate_minutes, 5)
        self.assertEqual(result.unknown_minutes, 0)

    def test_05_light_and_moderate_create_conflict(self):
        observations = [
            self.create_observation(
                0, 10, ActivityIntensity.LIGHT
            ),
            self.create_observation(
                0, 15, ActivityIntensity.MODERATE
            ),
        ]

        result = self.aggregate(observations)

        self.assertEqual(result.conflicted_minutes, 10)
        self.assertEqual(result.light_minutes, 0)
        self.assertEqual(result.moderate_minutes, 5)

    def test_06_all_unknown_intensity_remains_unknown(self):
        observations = [
            self.create_observation(
                0, 10, ActivityIntensity.UNKNOWN
            ),
            self.create_observation(
                0, 15, ActivityIntensity.UNKNOWN
            ),
        ]

        result = self.aggregate(observations)

        self.assertEqual(result.unknown_minutes, 15)
        self.assertEqual(result.conflicted_minutes, 0)

    def test_07_non_overlapping_intensities_are_independent(self):
        observations = [
            self.create_observation(
                0, 10, ActivityIntensity.MODERATE
            ),
            self.create_observation(
                20, 15, ActivityIntensity.VIGOROUS
            ),
        ]

        result = self.aggregate(observations)

        self.assertEqual(result.moderate_minutes, 10)
        self.assertEqual(result.vigorous_minutes, 15)
        self.assertEqual(result.conflicted_minutes, 0)





if __name__ == "__main__":
    unittest.main()

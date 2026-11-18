import unittest

from app.models.activity import ActivityObservation
from app.models.common import ActivitySource, ActivityType
from app.repositories.activity_repository import (
    InMemoryActivityRepository,
)


class TestInMemoryActivityRepository(unittest.TestCase):

    def setUp(self):
        self.repository = InMemoryActivityRepository()

    def create_observation(
        self,
        user_id="user_001",
        source=ActivitySource.WEARABLE,
        source_event_id="event_001",
    ):
        return ActivityObservation(
            user_id=user_id,
            activity_type=ActivityType.WALKING,
            source=source,
            duration_minutes=10,
            source_event_id=source_event_id,
        )

    def test_01_add_and_get_observation(self):
        observation = self.create_observation()

        self.repository.add(observation)

        saved = self.repository.get_by_id(
            observation.observation_id
        )

        self.assertEqual(saved.user_id, "user_001")
        self.assertEqual(saved.duration_minutes, 10)

    def test_02_reject_duplicate_observation_id(self):
        observation = self.create_observation()

        self.repository.add(observation)

        with self.assertRaises(ValueError):
            self.repository.add(observation)

    def test_03_reject_duplicate_source_event(self):
        first = self.create_observation()

        second = self.create_observation()

        self.repository.add(first)

        with self.assertRaises(ValueError):
            self.repository.add(second)

    def test_04_list_observations_by_user(self):
        first = self.create_observation(
            user_id="user_001",
            source_event_id="event_001",
        )

        second = self.create_observation(
            user_id="user_001",
            source_event_id="event_002",
        )

        third = self.create_observation(
            user_id="user_002",
            source_event_id="event_003",
        )

        self.repository.add(first)
        self.repository.add(second)
        self.repository.add(third)

        user_observations = self.repository.list_by_user("user_001")

        self.assertEqual(len(user_observations), 2)
        self.assertTrue(
            all(item.user_id == "user_001" for item in user_observations)
        )


if __name__ == "__main__":
    unittest.main()
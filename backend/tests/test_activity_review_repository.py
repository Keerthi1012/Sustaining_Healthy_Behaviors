
import unittest
from datetime import datetime, timedelta, timezone

from app.models.activity_review import ActivityIntensityReview
from app.models.common import (
    ActivityIntensity,
    ActivityReviewStatus,
)
from app.repositories.activity_review_repository import (
    InMemoryActivityReviewRepository,
)


class TestActivityReviewRepository(unittest.TestCase):

    def setUp(self):
        self.repository = InMemoryActivityReviewRepository()

        start = datetime(2026, 11, 10, 8, 0, tzinfo=timezone.utc)

        self.review = ActivityIntensityReview(
            user_id="user_001",
            period_start=start,
            period_end=start + timedelta(minutes=10),
            observation_ids=["phone_001", "watch_001"],
        )

    def test_01_save_and_retrieve_review(self):
        self.repository.save(self.review)

        retrieved = self.repository.get_by_id(
            self.review.review_id
        )

        self.assertEqual(retrieved, self.review)

    def test_02_duplicate_review_id_is_rejected(self):
        self.repository.save(self.review)

        with self.assertRaises(ValueError):
            self.repository.save(self.review)

    def test_03_list_reviews_by_user(self):
        self.repository.save(self.review)

        other_review = self.review.model_copy(
            update={
                "review_id": "review_002",
                "user_id": "user_002",
            }
        )
        self.repository.save(other_review)

        results = self.repository.list_by_user("user_001")

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].user_id, "user_001")

    def test_04_list_reviews_returns_empty_for_unknown_user(self):
        results = self.repository.list_by_user("unknown_user")

        self.assertEqual(results, [])

    def test_05_get_unknown_review_returns_none(self):
        result = self.repository.get_by_id("missing_review")

        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()

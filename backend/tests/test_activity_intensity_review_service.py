
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
from app.services.activity_intensity_review_service import (
    record_intensity_review,
)


class TestActivityIntensityReviewService(unittest.TestCase):

    def setUp(self):
        self.repository = InMemoryActivityReviewRepository()

        self.start = datetime(
            2026, 11, 10, 8, 0, tzinfo=timezone.utc
        )

        self.review = ActivityIntensityReview(
            user_id="user_001",
            period_start=self.start,
            period_end=self.start + timedelta(minutes=10),
            observation_ids=["phone_001", "watch_001"],
        )

        self.repository.save(self.review)

        self.reviewed_at = self.start + timedelta(minutes=15)

    def test_01_user_can_confirm_intensity(self):
        result = record_intensity_review(
            repository=self.repository,
            review_id=self.review.review_id,
            user_id="user_001",
            confirmed_intensity=ActivityIntensity.MODERATE,
            reviewed_at=self.reviewed_at,
        )

        self.assertEqual(
            result.status, ActivityReviewStatus.CONFIRMED
        )
        self.assertEqual(
            result.confirmed_intensity,
            ActivityIntensity.MODERATE,
        )
        self.assertEqual(result.reviewed_at, self.reviewed_at)

    def test_02_user_can_leave_intensity_unresolved(self):
        result = record_intensity_review(
            repository=self.repository,
            review_id=self.review.review_id,
            user_id="user_001",
            confirmed_intensity=None,
            reviewed_at=self.reviewed_at,
        )

        self.assertEqual(
            result.status, ActivityReviewStatus.UNRESOLVED
        )
        self.assertIsNone(result.confirmed_intensity)

    def test_03_other_user_cannot_resolve_review(self):
        with self.assertRaises(PermissionError):
            record_intensity_review(
                repository=self.repository,
                review_id=self.review.review_id,
                user_id="user_002",
                confirmed_intensity=ActivityIntensity.MODERATE,
                reviewed_at=self.reviewed_at,
            )

    def test_04_review_cannot_be_resolved_twice(self):
        record_intensity_review(
            repository=self.repository,
            review_id=self.review.review_id,
            user_id="user_001",
            confirmed_intensity=ActivityIntensity.MODERATE,
            reviewed_at=self.reviewed_at,
        )

        with self.assertRaises(ValueError):
            record_intensity_review(
                repository=self.repository,
                review_id=self.review.review_id,
                user_id="user_001",
                confirmed_intensity=ActivityIntensity.VIGOROUS,
                reviewed_at=self.reviewed_at,
            )

    def test_05_unknown_intensity_cannot_be_confirmed(self):
        with self.assertRaises(ValueError):
            record_intensity_review(
                repository=self.repository,
                review_id=self.review.review_id,
                user_id="user_001",
                confirmed_intensity=ActivityIntensity.UNKNOWN,
                reviewed_at=self.reviewed_at,
            )

    def test_06_missing_review_is_rejected(self):
        with self.assertRaises(ValueError):
            record_intensity_review(
                repository=self.repository,
                review_id="missing_review",
                user_id="user_001",
                confirmed_intensity=ActivityIntensity.MODERATE,
                reviewed_at=self.reviewed_at,
            )

    def test_07_original_review_is_not_mutated(self):
        original_status = self.review.status
        original_intensity = self.review.confirmed_intensity

        record_intensity_review(
            repository=self.repository,
            review_id=self.review.review_id,
            user_id="user_001",
            confirmed_intensity=ActivityIntensity.MODERATE,
            reviewed_at=self.reviewed_at,
        )

        self.assertEqual(self.review.status, original_status)
        self.assertEqual(
            self.review.confirmed_intensity,
            original_intensity,
        )


if __name__ == "__main__":
    unittest.main()

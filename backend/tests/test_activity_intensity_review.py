
from datetime import datetime, timedelta, timezone

import unittest
from pydantic import ValidationError

from app.models.activity_review import (
    ActivityIntensityReview,
)
from app.models.common import (
    ActivityIntensity,
    ActivityReviewStatus,
)


class TestActivityIntensityReview(unittest.TestCase):

    def setUp(self):
        self.start = datetime(
            2026, 11, 10, 8, 0, tzinfo=timezone.utc
        )
        self.end = self.start + timedelta(minutes=10)

    def test_01_pending_review_is_valid(self):
        review = ActivityIntensityReview(
            user_id="user_001",
            period_start=self.start,
            period_end=self.end,
            observation_ids=["phone_001", "watch_001"],
        )

        self.assertEqual(
            review.status, ActivityReviewStatus.PENDING
        )
        self.assertIsNone(review.confirmed_intensity)
        self.assertIsNone(review.reviewed_at)

    def test_02_confirmed_review_requires_known_intensity(self):
        reviewed_at = self.end + timedelta(minutes=2)

        review = ActivityIntensityReview(
            user_id="user_001",
            period_start=self.start,
            period_end=self.end,
            observation_ids=["phone_001", "watch_001"],
            status=ActivityReviewStatus.CONFIRMED,
            confirmed_intensity=ActivityIntensity.MODERATE,
            reviewed_at=reviewed_at,
        )

        self.assertEqual(
            review.confirmed_intensity,
            ActivityIntensity.MODERATE,
        )

    def test_03_confirmed_review_rejects_unknown_intensity(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=self.start,
                period_end=self.end,
                observation_ids=["phone_001", "watch_001"],
                status=ActivityReviewStatus.CONFIRMED,
                confirmed_intensity=ActivityIntensity.UNKNOWN,
                reviewed_at=self.end,
            )

    def test_04_confirmed_review_requires_reviewed_at(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=self.start,
                period_end=self.end,
                observation_ids=["phone_001", "watch_001"],
                status=ActivityReviewStatus.CONFIRMED,
                confirmed_intensity=ActivityIntensity.MODERATE,
            )

    def test_05_unresolved_review_is_valid(self):
        review = ActivityIntensityReview(
            user_id="user_001",
            period_start=self.start,
            period_end=self.end,
            observation_ids=["phone_001", "watch_001"],
            status=ActivityReviewStatus.UNRESOLVED,
            reviewed_at=self.end,
        )

        self.assertIsNone(review.confirmed_intensity)

    def test_06_unresolved_review_rejects_confirmed_intensity(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=self.start,
                period_end=self.end,
                observation_ids=["phone_001", "watch_001"],
                status=ActivityReviewStatus.UNRESOLVED,
                confirmed_intensity=ActivityIntensity.MODERATE,
                reviewed_at=self.end,
            )

    def test_07_review_requires_at_least_two_observations(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=self.start,
                period_end=self.end,
                observation_ids=["phone_001"],
            )

    def test_08_duplicate_observation_ids_are_rejected(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=self.start,
                period_end=self.end,
                observation_ids=["phone_001", "phone_001"],
            )

    def test_09_end_must_be_after_start(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=self.end,
                period_end=self.start,
                observation_ids=["phone_001", "watch_001"],
            )

    def test_10_timezone_is_required(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=datetime(2026, 11, 10, 8, 0),
                period_end=self.end,
                observation_ids=["phone_001", "watch_001"],
            )

    def test_11_extra_fields_are_rejected(self):
        with self.assertRaises(ValidationError):
            ActivityIntensityReview(
                user_id="user_001",
                period_start=self.start,
                period_end=self.end,
                observation_ids=["phone_001", "watch_001"],
                unexpected_field="not allowed",
            )


if __name__ == "__main__":
    unittest.main()

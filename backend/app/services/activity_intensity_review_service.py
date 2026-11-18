
from datetime import datetime

from app.models.activity_review import ActivityIntensityReview
from app.models.common import (
    ActivityIntensity,
    ActivityReviewStatus,
)
from app.repositories.activity_review_repository import (
    InMemoryActivityReviewRepository,
)


def record_intensity_review(
    repository: InMemoryActivityReviewRepository,
    review_id: str,
    user_id: str,
    confirmed_intensity: ActivityIntensity | None,
    reviewed_at: datetime,
) -> ActivityIntensityReview:

    # Retrieve the requested review.
    review = repository.get_by_id(review_id)

    if review is None:
        raise ValueError("Activity intensity review not found")

    # Only the owner can respond.
    if review.user_id != user_id:
        raise PermissionError(
            "User is not authorized to resolve this review"
        )

    # A review can only be resolved once.
    if review.status != ActivityReviewStatus.PENDING:
        raise ValueError(
            "Activity intensity review has already been resolved"
        )

    # Determine the user's response.
    if confirmed_intensity is None:
        updated_review = review.model_copy(
            update={
                "status": ActivityReviewStatus.UNRESOLVED,
                "confirmed_intensity": None,
                "reviewed_at": reviewed_at,
            }
        )

    else:
        if confirmed_intensity == ActivityIntensity.UNKNOWN:
            raise ValueError(
                "Unknown intensity cannot be confirmed"
            )

        updated_review = review.model_copy(
            update={
                "status": ActivityReviewStatus.CONFIRMED,
                "confirmed_intensity": confirmed_intensity,
                "reviewed_at": reviewed_at,
            }
        )

    # Validate the updated model before saving.
    updated_review = ActivityIntensityReview.model_validate(
        updated_review.model_dump()
    )

    repository.update(updated_review)

    return updated_review

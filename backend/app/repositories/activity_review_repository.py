
from app.models.activity_review import ActivityIntensityReview


class InMemoryActivityReviewRepository:

    def __init__(self):
        self._reviews: dict[str, ActivityIntensityReview] = {}

    def save(self, review: ActivityIntensityReview) -> None:
        if review.review_id in self._reviews:
            raise ValueError(
                f"Review already exists: {review.review_id}"
            )

        self._reviews[review.review_id] = review

    def get_by_id(
        self,
        review_id: str,
    ) -> ActivityIntensityReview | None:
        return self._reviews.get(review_id)

    def list_by_user(
        self,
        user_id: str,
    ) -> list[ActivityIntensityReview]:
        return [
            review
            for review in self._reviews.values()
            if review.user_id == user_id
        ]
    def update(self, review: ActivityIntensityReview) -> None:
        if review.review_id not in self._reviews:
            raise ValueError(
                f"Review does not exist: {review.review_id}"
            )

        self._reviews[review.review_id] = review

from datetime import datetime, timedelta

from app.models.activity import ActivityObservation
from dataclasses import dataclass

from app.models.common import ActivityIntensity

@dataclass(frozen=True)
class ActivityIntensitySummary:
    light_minutes: float = 0.0
    moderate_minutes: float = 0.0
    vigorous_minutes: float = 0.0
    unknown_minutes: float = 0.0
    conflicted_minutes: float = 0.0
def aggregate_activity_duration(
    user_id: str,
    observations: list[ActivityObservation],
    period_start: datetime,
    period_end: datetime,
) -> float:
    """
    Calculate total activity duration without double-counting
    overlapping observations.

    Activities are grouped by user, but different activity types
    share the same timeline so overlapping activities are counted
    only once.
    """

    if period_start.tzinfo is None or period_end.tzinfo is None:
        raise ValueError("Period boundaries must be timezone-aware")

    if period_end <= period_start:
        raise ValueError("Period end must be after period start")

    intervals: list[tuple[datetime, datetime]] = []

    for observation in observations:

        if observation.user_id != user_id:
            continue

        if observation.duration_minutes is None:
            continue

        activity_start = observation.started_at

        if activity_start.tzinfo is None:
            raise ValueError(
                "Activity start time must be timezone-aware"
            )

        activity_end = activity_start + timedelta(
            minutes=observation.duration_minutes
        )

        # Ignore activities outside the requested period.
        if activity_end <= period_start:
            continue

        if activity_start >= period_end:
            continue

        # Clip activities to the requested period.
        clipped_start = max(activity_start, period_start)
        clipped_end = min(activity_end, period_end)

        intervals.append((clipped_start, clipped_end))

    if not intervals:
        return 0.0

    # Sort intervals by their start time.
    intervals.sort(key=lambda interval: interval[0])

    total_duration = timedelta(0)

    current_start, current_end = intervals[0]

    for next_start, next_end in intervals[1:]:

        if next_start <= current_end:
            # Overlapping or directly adjacent intervals.
            current_end = max(current_end, next_end)

        else:
            total_duration += current_end - current_start
            current_start = next_start
            current_end = next_end

    # Include the final interval.
    total_duration += current_end - current_start

    return total_duration.total_seconds() / 60


def aggregate_activity_intensity(
    user_id: str,
    observations: list[ActivityObservation],
    period_start: datetime,
    period_end: datetime,
) -> ActivityIntensitySummary:
    """
    Classify activity time by intensity without double-counting
    overlapping observations.

    Overlapping records with different intensity values are
    classified as conflicted.
    """

    if period_start.tzinfo is None or period_end.tzinfo is None:
        raise ValueError("Period boundaries must be timezone-aware")

    if period_end <= period_start:
        raise ValueError("Period end must be after period start")

    intervals = []

    for observation in observations:
        if observation.user_id != user_id:
            continue

        if observation.duration_minutes is None:
            continue

        activity_start = observation.started_at

        if activity_start.tzinfo is None:
            raise ValueError(
                "Activity start time must be timezone-aware"
            )

        activity_end = activity_start + timedelta(
            minutes=observation.duration_minutes
        )

        if activity_end <= period_start:
            continue

        if activity_start >= period_end:
            continue

        clipped_start = max(activity_start, period_start)
        clipped_end = min(activity_end, period_end)

        intervals.append(
            (clipped_start, clipped_end, observation.intensity)
        )

    if not intervals:
        return ActivityIntensitySummary()

    # Create boundaries from every interval start and end.
    boundaries = sorted({
        boundary
        for start, end, _ in intervals
        for boundary in (start, end)
    })

    totals = {
        ActivityIntensity.LIGHT: 0.0,
        ActivityIntensity.MODERATE: 0.0,
        ActivityIntensity.VIGOROUS: 0.0,
        "unknown": 0.0,
        "conflicted": 0.0,
    }

    # Examine each small segment between consecutive boundaries.
    for index in range(len(boundaries) - 1):
        segment_start = boundaries[index]
        segment_end = boundaries[index + 1]

        active_intensities = {
            intensity
            for start, end, intensity in intervals
            if start < segment_end and end > segment_start
        }

        if not active_intensities:
            continue

        if len(active_intensities) > 1:
            category = "conflicted"

        else:
            intensity = next(iter(active_intensities))

            if intensity == ActivityIntensity.UNKNOWN:
                category = "unknown"
            else:
                category = intensity

        minutes = (
            segment_end - segment_start
        ).total_seconds() / 60

        totals[category] += minutes

    return ActivityIntensitySummary(
        light_minutes=totals[ActivityIntensity.LIGHT],
        moderate_minutes=totals[ActivityIntensity.MODERATE],
        vigorous_minutes=totals[ActivityIntensity.VIGOROUS],
        unknown_minutes=totals["unknown"],
        conflicted_minutes=totals["conflicted"],
    )

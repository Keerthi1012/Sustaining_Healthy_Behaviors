
from fastapi import APIRouter, HTTPException, Request, status

from app.models.common import HealthDomain, HabitStatus, TargetMetric
from app.models.feedback import HabitFeedback
from app.models.habit import Habit
from app.models.habit_api import (
    HabitCatalog,
    ProgressionEvaluationRequest,
)
from app.models.user_habit import UserHabitState
from app.services.progression_service import (
    ProgressionDecision,
    evaluate_progression,
)


router = APIRouter(tags=["Habits"])


def get_habit_repository(request: Request):
    repository = getattr(request.app.state, "habit_repository", None)

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The habit library is not available.",
        )

    return repository


def parse_domain(domain: str) -> HealthDomain:
    try:
        return HealthDomain(domain)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown habit domain '{domain}'.",
        ) from exc


def get_domain_habits(
    request: Request,
    domain: HealthDomain,
) -> list[Habit]:
    repository = get_habit_repository(request)
    habits = [
        habit
        for habit in repository.list_by_domain(domain)
        if habit.active
    ]

    if not habits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {domain.value} habits are available.",
        )

    return habits


def select_habit(
    habits: list[Habit],
    habit_id: str | None,
    domain: HealthDomain,
) -> Habit:
    if habit_id is None:
        return habits[0]

    match = next(
        (habit for habit in habits if habit.habit_id == habit_id),
        None,
    )

    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{domain.value.capitalize()} habit '{habit_id}' was not found.",
        )

    return match


@router.get(
    "/api/habits/{domain}",
    response_model=HabitCatalog,
)
def get_habit_catalog(domain: str, request: Request) -> HabitCatalog:
    health_domain = parse_domain(domain)
    repository = get_habit_repository(request)
    catalog = repository.get_catalog(health_domain)

    if catalog is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {health_domain.value} habits are available.",
        )

    active_habits = [
        habit for habit in catalog.habits if habit.active
    ]

    if not active_habits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {health_domain.value} habits are available.",
        )

    return catalog.model_copy(update={"habits": active_habits})


@router.post(
    "/api/habits/{domain}/progression",
    response_model=ProgressionDecision,
)
def evaluate_habit_progression(
    domain: str,
    payload: ProgressionEvaluationRequest,
    request: Request,
) -> ProgressionDecision:
    health_domain = parse_domain(domain)
    habits = get_domain_habits(request, health_domain)
    habit = select_habit(habits, payload.habit_id, health_domain)

    profile = next(
        (
            item
            for item in habit.progression_profiles
            if item.metric == TargetMetric.DURATION_MINUTES
        ),
        habit.progression_profiles[0],
    )

    level = next(
        (
            item
            for item in profile.levels
            if item.level == payload.current_level
        ),
        None,
    )

    if level is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Level {payload.current_level} does not exist for "
                f"habit '{habit.habit_id}'."
            ),
        )

    state = UserHabitState(
        user_id="progression-preview",
        habit_id=habit.habit_id,
        status=HabitStatus.ACTIVE,
        current_level=level.level,
        current_target=level.target,
        progression_paused=payload.progression_paused,
    )

    feedback_history = [
        HabitFeedback(
            user_habit_state_id=state.state_id,
            completed=item.completed,
            difficulty=item.difficulty,
            safety_signal=item.safety_signal,
            recorded_at=item.recorded_at,
        )
        for item in payload.feedback_history
    ]

    try:
        return evaluate_progression(state, habit, feedback_history)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

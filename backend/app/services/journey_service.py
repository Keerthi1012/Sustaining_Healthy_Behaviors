import copy
import math
from datetime import date, datetime, timezone
from uuid import uuid4

from app.models.common import (
    FeedbackDifficulty,
    HabitStatus,
    SafetySignal,
    TargetMetric,
)
from app.models.feedback import HabitFeedback
from app.models.habit import Habit
from app.models.journey import CompletionRequest, Journey
from app.models.user_habit import UserHabitState
from app.repositories.habit_repository import HabitRepository
from app.repositories.journey_repository import (
    JourneyNotFoundError,
    JourneyRecord,
    JourneyRevisionConflictError,
    JourneyRevisionRequiredError,
    SqliteIdempotencyRepository,
    SqliteJourneyRepository,
)
from app.repositories.sqlite_user_habit_repository import (
    SqliteUserHabitRepository,
)
from app.services.habit_orchestration_service import (
    process_habit_feedback,
)
from app.services.progression_service import (
    ProgressionAction,
    ProgressionDecision,
)
from app.storage.database import SqliteDatabase


SAFETY_MESSAGE = (
    "Thank you for telling us. Please stop this activity and seek "
    "medical advice if the concern continues."
)
MAX_MOVEMENT_BOUT_MINUTES = 10
SLOT_ORDER = ("primary", "secondary")


class JourneySlotNotFoundError(KeyError):
    pass


class JourneySlotResolvedError(Exception):
    pass


class JourneySimulationNotAllowedError(Exception):
    pass


class JourneySimulationMismatchError(Exception):
    pass


class JourneyService:
    def __init__(
        self,
        database: SqliteDatabase,
        habit_repository: HabitRepository,
        demo_mode: bool = False,
    ):
        self._database = database
        self._habits = habit_repository
        self._demo_mode = bool(demo_mode)

    def get(self, user_id: str) -> JourneyRecord | None:
        return SqliteJourneyRepository(self._database).get(user_id)

    def save(
        self,
        user_id: str,
        journey_data: dict,
        expected_revision: int | None,
    ) -> JourneyRecord:
        journey = Journey.model_validate(journey_data)
        payload = copy.deepcopy(
            journey.model_dump(by_alias=True)
        )
        now = datetime.now(timezone.utc).isoformat()

        payload["version"] = 2
        payload.setdefault("createdAt", now)
        payload["updatedAt"] = now

        repository = SqliteJourneyRepository(self._database)
        existing = repository.get(user_id)

        if existing is None:
            if expected_revision not in (None, 0):
                raise JourneyRevisionConflictError(0)

            return repository.create(user_id, payload)

        if expected_revision is None:
            raise JourneyRevisionRequiredError()

        return repository.replace(
            user_id,
            payload,
            expected_revision,
        )

    def delete(self, user_id: str) -> bool:
        return SqliteJourneyRepository(self._database).delete(user_id)

    def complete_slot(
        self,
        user_id: str,
        request: CompletionRequest,
        idempotency_key: str,
    ) -> dict:
        with self._database.transaction(write=True) as connection:
            journeys = SqliteJourneyRepository(
                self._database,
                connection,
            )
            idempotency = SqliteIdempotencyRepository(
                self._database,
                connection,
            )
            cached = idempotency.get(
                user_id,
                "complete_slot",
                idempotency_key,
            )

            if cached is not None:
                if (
                    request.simulated_at is not None
                    and not self._demo_mode
                ):
                    raise JourneySimulationNotAllowedError()
                return cached

            record = journeys.get(user_id)
            if record is None:
                raise JourneyNotFoundError(user_id)

            if record.revision != request.expected_revision:
                raise JourneyRevisionConflictError(record.revision)

            payload = copy.deepcopy(record.journey)
            plan = payload.get("plan")
            if not isinstance(plan, dict):
                raise JourneySlotNotFoundError(request.day_id)

            day = next(
                (
                    item
                    for item in plan.get("days", [])
                    if item.get("id") == request.day_id
                ),
                None,
            )

            if day is None or not isinstance(day.get(request.slot), dict):
                raise JourneySlotNotFoundError(request.day_id)

            now = self._resolve_completion_time(request, day)

            entry = day[request.slot]
            if entry.get("status") != "planned":
                raise JourneySlotResolvedError()

            now_iso = now.isoformat()
            safe = request.feedback.safety == "none"

            entry["status"] = "completed" if safe else "paused"
            entry["completedAt"] = now_iso
            entry["feedback"] = request.feedback.model_dump()

            if not safe:
                plan["safetyPause"] = True
                plan["safetyMessage"] = SAFETY_MESSAGE
                self._add_adaptation(
                    plan,
                    {
                        "type": "safety_pause",
                        "dayId": request.day_id,
                        "slot": request.slot,
                        "reason": "A safety concern was reported.",
                    },
                )

            decision = self._update_progression(
                connection,
                user_id,
                plan,
                day,
                request,
                now,
            )

            payload["updatedAt"] = now_iso
            updated = journeys.replace(
                user_id,
                payload,
                record.revision,
            )
            response = {
                "journey": updated.journey,
                "revision": updated.revision,
                "decision": (
                    decision.model_dump(mode="json")
                    if decision is not None
                    else None
                ),
            }
            idempotency.save(
                user_id,
                "complete_slot",
                idempotency_key,
                response,
            )

            return response

    def _resolve_completion_time(
        self,
        request: CompletionRequest,
        day: dict,
    ) -> datetime:
        if request.simulated_at is None:
            return datetime.now(timezone.utc)

        if not self._demo_mode:
            raise JourneySimulationNotAllowedError()

        simulated = request.simulated_at
        if simulated.tzinfo is None:
            simulated = simulated.replace(tzinfo=timezone.utc)

        day_date = day.get("date")
        if not isinstance(day_date, str):
            raise JourneySimulationMismatchError()

        try:
            planned_date = date.fromisoformat(day_date[:10])
        except ValueError as exc:
            raise JourneySimulationMismatchError() from exc

        if simulated.date() != planned_date:
            raise JourneySimulationMismatchError()

        return simulated

    def _update_progression(
        self,
        connection,
        user_id: str,
        plan: dict,
        day: dict,
        request: CompletionRequest,
        now: datetime,
    ) -> ProgressionDecision | None:
        entry = day[request.slot]
        habit_id = entry.get("habitId") or entry.get("id")
        if not habit_id:
            return None

        habit = self._habits.get_by_id(habit_id)
        if habit is None:
            return None

        states = SqliteUserHabitRepository(
            self._database,
            connection,
        )
        state = states.get_state_by_user_habit(user_id, habit_id)

        if state is None:
            state = self._state_for_entry(user_id, habit, entry)
            states.add_state(state)

        if state.status != HabitStatus.ACTIVE:
            return None

        difficulty = (
            FeedbackDifficulty.UNCOMFORTABLE
            if request.feedback.difficulty == "too_much"
            else FeedbackDifficulty(request.feedback.difficulty)
        )
        feedback = HabitFeedback(
            user_habit_state_id=state.state_id,
            completed=True,
            difficulty=difficulty,
            safety_signal=SafetySignal(request.feedback.safety),
            recorded_at=now,
        )

        result = process_habit_feedback(
            states,
            habit,
            feedback,
        )
        plan["days"] = self._apply_decision(
            plan,
            request.day_id,
            request.slot,
            result.decision,
        )
        return result.decision

    @staticmethod
    def _state_for_entry(
        user_id: str,
        habit: Habit,
        entry: dict,
    ) -> UserHabitState:
        metric = entry.get("measure")
        profile = next(
            (
                item
                for item in habit.progression_profiles
                if metric is not None
                and item.metric.value == metric
            ),
            habit.progression_profiles[0],
        )
        level_number = entry.get("progressionLevel")
        level = next(
            (
                item
                for item in profile.levels
                if item.level == level_number
            ),
            None,
        )

        if level is None:
            level = next(
                item
                for item in profile.levels
                if item.level == profile.starting_level
            )

        return UserHabitState(
            user_id=user_id,
            habit_id=habit.habit_id,
            status=HabitStatus.ACTIVE,
            current_level=level.level,
            current_target=level.target,
        )

    def _apply_decision(
        self,
        plan: dict,
        day_id: str,
        slot: str,
        decision: ProgressionDecision,
    ) -> list[dict]:
        days = plan.get("days", [])

        if decision.action == ProgressionAction.MAINTAIN:
            return days

        completed = next(
            (
                day[slot]
                for day in days
                if day.get("id") == day_id
                and isinstance(day.get(slot), dict)
            ),
            None,
        )
        if completed is None:
            return days

        next_slot = self._find_next_habit_entry(
            days,
            day_id,
            completed.get("habitId") or completed.get("id"),
            completed.get("domain"),
        )
        if next_slot is None:
            return days

        day, next_slot_name, entry = next_slot

        if decision.action == ProgressionAction.SAFETY_PAUSE:
            fallback = entry.get("fallback") or {}
            entry.update(
                {
                    "adapted": True,
                    "dose": fallback.get("dose", entry.get("dose")),
                    "durationLabel": fallback.get(
                        "durationLabel",
                        entry.get("durationLabel"),
                    ),
                    "title": fallback.get("title", entry.get("title")),
                    "text": fallback.get("text", entry.get("text")),
                }
            )
            self._add_adaptation(
                plan,
                {
                    "type": "safety_pause",
                    "dayId": day.get("id"),
                    "slot": next_slot_name,
                    "reason": decision.reason,
                },
            )
            return days

        recommended = float(decision.recommended_target)
        cap = (
            MAX_MOVEMENT_BOUT_MINUTES
            if entry.get("domain") == "movement"
            else math.inf
        )
        dose = max(
            1,
            min(
                math.floor(recommended + 0.5),
                cap,
            ),
        )

        entry.update(
            {
                "adapted": decision.action
                == ProgressionAction.DECREASE,
                "dose": dose,
                "durationLabel": self._format_dose(entry, dose),
                "progressionLevel": (
                    decision.recommended_level
                    if decision.recommended_level is not None
                    else entry.get("progressionLevel")
                ),
            }
        )
        self._add_adaptation(
            plan,
            {
                "type": "adjusted",
                "dayId": day.get("id"),
                "slot": next_slot_name,
                "reason": decision.reason,
            },
        )
        return days

    @staticmethod
    def _find_next_habit_entry(
        days: list[dict],
        day_id: str,
        habit_id: str | None,
        domain: str | None,
    ) -> tuple[dict, str, dict] | None:
        start_index = next(
            (
                index
                for index, day in enumerate(days)
                if day.get("id") == day_id
            ),
            -1,
        )
        if start_index == -1:
            return None

        for day in days[start_index + 1:]:
            for slot in SLOT_ORDER:
                entry = day.get(slot)
                if not isinstance(entry, dict):
                    continue
                if entry.get("domain") != domain:
                    continue
                if entry.get("status") != "planned":
                    continue
                if habit_id and (
                    entry.get("habitId") or entry.get("id")
                ) != habit_id:
                    continue

                return day, slot, entry

        return None

    @staticmethod
    def _add_adaptation(plan: dict, adaptation: dict) -> None:
        adaptations = plan.setdefault("adaptations", [])
        adaptations.append(
            {
                "id": f"adaptation-{uuid4().hex[:8]}",
                "at": datetime.now(timezone.utc).isoformat(),
                **adaptation,
            }
        )

    @staticmethod
    def _format_dose(entry: dict, dose: int) -> str:
        if entry.get("measure") == TargetMetric.DURATION_MINUTES.value:
            return f"{dose} min"
        if entry.get("measure") == "routine_completed":
            return f"{dose} min" if dose >= 5 else "A few minutes"
        return "A short pause"

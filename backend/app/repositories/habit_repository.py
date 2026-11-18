import json
from pathlib import Path

from pydantic import ValidationError

from app.models.catalog import HabitCatalog
from app.models.common import HealthDomain
from app.models.habit import Habit


CATALOG_FILES = {
    HealthDomain.MOVEMENT: "movement.json",
    HealthDomain.SLEEP: "sleep.json",
    HealthDomain.NUTRITION: "nutrition.json",
    HealthDomain.SMOKING: "smoking.json",
}

SUPPORTED_SCHEMA_VERSIONS = {"1.0.0"}


class HabitRepository:
    def __init__(self, library_dir: Path | None = None):
        self.library_dir = library_dir or (
            Path(__file__).resolve().parents[1]
            / "data"
            / "habit_library"
        )

        self._habits: dict[str, Habit] = {}
        self._catalogs: dict[HealthDomain, HabitCatalog] = {}
        self.load()

    def load(self) -> None:
        """Load and validate the habit catalogs for every health domain."""

        self._habits.clear()
        self._catalogs.clear()

        if not self.library_dir.exists():
            raise FileNotFoundError(
                f"Habit library directory not found: {self.library_dir}"
            )

        for domain, file_name in CATALOG_FILES.items():
            file_path = self.library_dir / file_name

            if not file_path.exists():
                raise FileNotFoundError(
                    f"Habit library file not found: {file_path}"
                )

            try:
                data = json.loads(
                    file_path.read_text(encoding="utf-8")
                )

                if not isinstance(data, dict):
                    raise ValueError("Expected a JSON object")

                catalog = HabitCatalog.model_validate(data)

                self._validate_catalog(catalog, domain)

                for habit in catalog.habits:
                    self._habits[habit.habit_id] = habit

                self._catalogs[domain] = catalog

            except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                raise ValueError(
                    f"Error loading habit library file "
                    f"'{file_path.name}': {exc}"
                ) from exc

    def _validate_catalog(
        self,
        catalog: HabitCatalog,
        expected_domain: HealthDomain,
    ) -> None:
        if catalog.schema_version not in SUPPORTED_SCHEMA_VERSIONS:
            raise ValueError(
                f"Unsupported schema version '{catalog.schema_version}'. "
                f"Supported versions: "
                f"{', '.join(sorted(SUPPORTED_SCHEMA_VERSIONS))}"
            )

        if catalog.domain != expected_domain:
            raise ValueError(
                f"Expected catalog domain '{expected_domain.value}'"
            )

        for habit in catalog.habits:
            if habit.domain != expected_domain:
                raise ValueError(
                    f"Habit '{habit.habit_id}' does not match "
                    f"catalog domain '{expected_domain.value}'"
                )

            if habit.habit_id in self._habits:
                raise ValueError(
                    f"Duplicate habit ID: {habit.habit_id}"
                )

            self._validate_levels(habit)

        habit_ids = [habit.habit_id for habit in catalog.habits]

        if len(habit_ids) != len(set(habit_ids)):
            raise ValueError("Duplicate habit ID in catalog")

        for habit in catalog.habits:
            if habit.active and (
                not habit.clinical_basis or not habit.limits
            ):
                raise ValueError(
                    f"Habit '{habit.habit_id}' must include "
                    f"clinical_basis and limits"
                )

    @staticmethod
    def _validate_levels(habit: Habit) -> None:
        for profile in habit.progression_profiles:
            levels = sorted(
                profile.levels,
                key=lambda level: level.level,
            )
            targets = [level.target.value for level in levels]

            if targets != sorted(targets):
                raise ValueError(
                    f"Habit '{habit.habit_id}' has non-monotonic "
                    f"progression targets"
                )

            if len(targets) != len(set(targets)):
                raise ValueError(
                    f"Habit '{habit.habit_id}' has duplicate "
                    f"progression targets"
                )

    def get_catalog(
        self,
        domain: HealthDomain,
    ) -> HabitCatalog | None:
        """Retrieve the validated catalog for a health domain."""

        catalog = self._catalogs.get(domain)

        if catalog is None:
            return None

        return catalog.model_copy(deep=True)

    def get_by_id(self, habit_id: str) -> Habit | None:
        """Retrieve a habit using its unique ID."""

        return self._habits.get(habit_id)

    def list_by_domain(self, domain: HealthDomain) -> list[Habit]:
        """Retrieve habits belonging to a health domain."""

        return [
            habit
            for habit in self._habits.values()
            if habit.domain == domain
        ]

    def list_active(self) -> list[Habit]:
        """Retrieve all active habits."""

        return [
            habit
            for habit in self._habits.values()
            if habit.active
        ]

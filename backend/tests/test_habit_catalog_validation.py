import json
import shutil
import tempfile
import unittest
from pathlib import Path

from app.models.common import HealthDomain
from app.repositories.habit_repository import HabitRepository


DEFAULT_LIBRARY = (
    Path(__file__).resolve().parents[1]
    / "app"
    / "data"
    / "habit_library"
)


class TestHabitCatalogValidation(unittest.TestCase):

    def make_library(self):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)

        library = Path(temp_dir.name) / "habit_library"
        shutil.copytree(DEFAULT_LIBRARY, library)
        return library

    def mutate_movement(self, library, mutator):
        path = library / "movement.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        mutator(data)
        path.write_text(
            json.dumps(data, ensure_ascii=False),
            encoding="utf-8",
        )

    def test_01_valid_library_exposes_review_metadata(self):
        repository = HabitRepository()
        catalog = repository.get_catalog(HealthDomain.SLEEP)

        self.assertIsNotNone(catalog)
        self.assertEqual(catalog.schema_version, "1.0.0")
        self.assertEqual(catalog.catalog_version, "1.0.0")
        self.assertEqual(catalog.reviewed_by, "Habit-RPG content team")
        self.assertEqual(catalog.review_status, "internal_review")
        self.assertTrue(catalog.evidence)
        self.assertTrue(catalog.boundaries.seek_help_if)
        self.assertTrue(catalog.safety_rules.signals)

    def test_02_rejects_unsupported_schema_version(self):
        library = self.make_library()
        self.mutate_movement(
            library,
            lambda data: data.update({"schema_version": "9.9.9"}),
        )

        with self.assertRaisesRegex(ValueError, "Unsupported schema version"):
            HabitRepository(library)

    def test_03_requires_evidence_and_review_dates(self):
        library = self.make_library()
        self.mutate_movement(
            library,
            lambda data: data.update({"evidence": []}),
        )

        with self.assertRaises(ValueError):
            HabitRepository(library)

    def test_04_rejects_expiry_before_review(self):
        library = self.make_library()
        self.mutate_movement(
            library,
            lambda data: data.update({"expires_at": "2020-01-01"}),
        )

        with self.assertRaisesRegex(ValueError, "expiry"):
            HabitRepository(library)

    def test_05_requires_clinical_basis_and_limits(self):
        library = self.make_library()

        def remove_clinical_basis(data):
            data["habits"][0]["clinical_basis"] = ""

        self.mutate_movement(library, remove_clinical_basis)

        with self.assertRaisesRegex(ValueError, "clinical_basis"):
            HabitRepository(library)

    def test_06_rejects_non_monotonic_levels(self):
        library = self.make_library()

        def break_levels(data):
            data["habits"][0]["progression_profiles"][0]["levels"][0][
                "target"
            ]["value"] = 99

        self.mutate_movement(library, break_levels)

        with self.assertRaisesRegex(ValueError, "non-monotonic"):
            HabitRepository(library)

    def test_07_rejects_duplicate_evidence_ids(self):
        library = self.make_library()

        def duplicate_evidence(data):
            data["evidence"][1]["id"] = data["evidence"][0]["id"]

        self.mutate_movement(library, duplicate_evidence)

        with self.assertRaisesRegex(ValueError, "Evidence source IDs"):
            HabitRepository(library)

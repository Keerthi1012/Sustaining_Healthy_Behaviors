
import unittest

from fastapi.testclient import TestClient

from main import app
from app.repositories.habit_repository import HabitRepository


EXPECTED_CATALOGS = {
    "movement": [
        "movement-walk-5",
        "movement-mobility-3",
        "movement-longer-way",
        "movement-fresh-air",
        "movement-rhythm",
        "movement-reset",
        "movement-reflect",
    ],
    "sleep": [
        "sleep-wake-time",
        "sleep-wind-down",
        "sleep-worry-dump",
        "sleep-room",
        "sleep-caffeine",
        "sleep-morning-light",
        "sleep-notice",
    ],
    "nutrition": [
        "nutrition-veggie-first",
        "nutrition-water-anchor",
        "nutrition-half-plate",
        "nutrition-protein-pair",
        "nutrition-mindful-pause",
    ],
    "smoking": [
        "smoking-delay-5",
        "smoking-water-breath",
        "smoking-trigger-swap",
        "smoking-clear-cue",
        "smoking-notice-trigger",
    ],
}


class TestHabitsAPI(unittest.TestCase):

    def setUp(self):
        app.state.habit_repository = HabitRepository()
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()

    def feedback(self, difficulty="easy", safety_signal="none", count=1):
        return [
            {
                "completed": True,
                "difficulty": difficulty,
                "safety_signal": safety_signal,
            }
            for _ in range(count)
        ]

    def evaluate(self, payload, domain="movement"):
        return self.client.post(
            f"/api/habits/{domain}/progression",
            json=payload,
        )

    def test_01_all_domain_catalogs_are_validated_and_returned(self):
        for domain, expected_ids in EXPECTED_CATALOGS.items():
            with self.subTest(domain=domain):
                response = self.client.get(f"/api/habits/{domain}")

                self.assertEqual(response.status_code, 200)

                body = response.json()

                self.assertEqual(body["domain"], domain)
                self.assertEqual(body["schema_version"], "1.0.0")
                self.assertEqual(body["catalog_version"], "1.0.0")
                self.assertEqual(body["reviewed_at"], "2026-11-14")
                self.assertEqual(body["expires_at"], "2027-11-14")
                self.assertEqual(body["reviewed_by"], "Habit-RPG content team")
                self.assertEqual(body["review_status"], "internal_review")
                self.assertGreaterEqual(len(body["evidence"]), 3)
                self.assertTrue(body["boundaries"]["not_for"])
                self.assertTrue(body["boundaries"]["seek_help_if"])
                self.assertTrue(body["safety_rules"]["screening"])
                self.assertTrue(body["safety_rules"]["signals"])
                self.assertEqual(
                    [item["habit_id"] for item in body["habits"]],
                    expected_ids,
                )

                for item in body["habits"]:
                    self.assertEqual(item["domain"], domain)
                    self.assertTrue(item["progression"]["enabled"])
                    self.assertEqual(
                        item["progression"]["min_successful_sessions"],
                        2,
                    )
                    self.assertTrue(item["clinical_basis"])
                    self.assertTrue(item["limits"])

                    levels = item["progression_profiles"][0]["levels"]
                    targets = [
                        level["target"]["value"]
                        for level in levels
                    ]

                    self.assertEqual(len(levels), 4)
                    self.assertEqual(targets, sorted(targets))
                    self.assertEqual(len(targets), len(set(targets)))
                    self.assertEqual(
                        [level["name"] for level in levels],
                        [
                            "Getting started",
                            "Building consistency",
                            "Growing stronger",
                            "Making it a routine",
                        ],
                    )

    def test_02_movement_progression_increases_after_sessions(self):
        response = self.evaluate(
            {
                "habit_id": "movement-walk-5",
                "current_level": 1,
                "feedback_history": self.feedback(count=2),
            }
        )

        self.assertEqual(response.status_code, 200)

        body = response.json()

        self.assertEqual(body["action"], "increase")
        self.assertEqual(body["reason_code"], "criteria_met")
        self.assertEqual(body["current_level"], 1)
        self.assertEqual(body["recommended_level"], 2)
        self.assertEqual(body["current_target"], 5)
        self.assertEqual(body["recommended_target"], 7)

    def test_03_progression_waits_without_enough_sessions(self):
        for domain, habit_id in [
            ("movement", "movement-walk-5"),
            ("sleep", "sleep-wind-down"),
            ("nutrition", "nutrition-veggie-first"),
            ("smoking", "smoking-delay-5"),
        ]:
            with self.subTest(domain=domain):
                response = self.evaluate(
                    {
                        "habit_id": habit_id,
                        "current_level": 1,
                        "feedback_history": self.feedback(count=1),
                    },
                    domain=domain,
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["action"], "maintain")
                self.assertEqual(
                    response.json()["reason_code"],
                    "insufficient_sessions",
                )

    def test_04_progression_increases_across_all_domains(self):
        for domain, habit_id, current_target, next_target in [
            ("sleep", "sleep-wind-down", 10, 12),
            ("nutrition", "nutrition-veggie-first", 2, 3),
            ("smoking", "smoking-delay-5", 5, 7),
        ]:
            with self.subTest(domain=domain):
                response = self.evaluate(
                    {
                        "habit_id": habit_id,
                        "current_level": 1,
                        "feedback_history": self.feedback(count=2),
                    },
                    domain=domain,
                )

                self.assertEqual(response.status_code, 200)

                body = response.json()

                self.assertEqual(body["action"], "increase")
                self.assertEqual(body["reason_code"], "criteria_met")
                self.assertEqual(body["current_level"], 1)
                self.assertEqual(body["recommended_level"], 2)
                self.assertEqual(body["current_target"], current_target)
                self.assertEqual(
                    body["recommended_target"],
                    next_target,
                )

    def test_05_uncomfortable_feedback_decreases_one_level(self):
        response = self.evaluate(
            {
                "current_level": 2,
                "feedback_history": self.feedback(
                    difficulty="uncomfortable",
                    count=1,
                ),
            }
        )

        self.assertEqual(response.status_code, 200)

        body = response.json()

        self.assertEqual(body["action"], "decrease")
        self.assertEqual(body["reason_code"], "uncomfortable")
        self.assertEqual(body["recommended_level"], 1)
        self.assertEqual(body["recommended_target"], 5)

    def test_06_safety_signal_pauses_progression(self):
        response = self.evaluate(
            {
                "current_level": 2,
                "feedback_history": self.feedback(
                    difficulty="easy",
                    safety_signal="pain",
                    count=1,
                ),
            }
        )

        self.assertEqual(response.status_code, 200)

        body = response.json()

        self.assertEqual(body["action"], "safety_pause")
        self.assertEqual(body["reason_code"], "safety_concern")
        self.assertEqual(body["recommended_level"], 2)

    def test_07_unknown_level_is_rejected(self):
        response = self.evaluate(
            {
                "current_level": 99,
                "feedback_history": [],
            }
        )

        self.assertEqual(response.status_code, 400)

    def test_08_unknown_habit_is_rejected(self):
        response = self.evaluate(
            {
                "habit_id": "movement_missing",
                "current_level": 1,
                "feedback_history": [],
            }
        )

        self.assertEqual(response.status_code, 404)

    def test_09_habit_from_another_domain_is_rejected(self):
        response = self.evaluate(
            {
                "habit_id": "movement-walk-5",
                "current_level": 1,
                "feedback_history": [],
            },
            domain="sleep",
        )

        self.assertEqual(response.status_code, 404)

    def test_10_unknown_domain_is_rejected(self):
        catalog = self.client.get("/api/habits/alcohol")

        self.assertEqual(catalog.status_code, 404)

        progression = self.evaluate(
            {
                "current_level": 1,
                "feedback_history": [],
            },
            domain="alcohol",
        )

        self.assertEqual(progression.status_code, 404)

    def test_11_paused_progression_is_maintained(self):
        response = self.evaluate(
            {
                "current_level": 1,
                "progression_paused": True,
                "feedback_history": self.feedback(count=5),
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["action"], "maintain")
        self.assertEqual(
            response.json()["reason_code"],
            "progression_disabled",
        )

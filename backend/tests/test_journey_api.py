import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.repositories.auth_token_repository import (
    InMemoryAuthTokenRepository,
)
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService
from app.services.journey_service import JourneyService
from app.storage.database import SqliteDatabase
from main import app


def make_entry(
    habit_id="movement-walk-5",
    level=1,
    dose=5,
):
    return {
        "id": habit_id,
        "habitId": habit_id,
        "domain": "movement",
        "status": "planned",
        "progressionLevel": level,
        "measure": "duration_minutes",
        "dose": dose,
        "durationLabel": f"{dose} min",
        "title": "A short walk",
        "text": "Take a gentle walk.",
        "fallback": {
            "title": "A few minutes",
            "text": "Take a shorter walk.",
            "dose": 3,
            "durationLabel": "3 min",
        },
    }


def make_journey(day_count=2):
    return {
        "version": 2,
        "profile": {"primaryGoalId": "movement"},
        "preferences": {"soundEnabled": True},
        "plan": {
            "id": "plan-1",
            "paused": False,
            "adaptations": [],
            "days": [
                {
                    "id": f"day-{index + 1}",
                    "date": f"2026-11-{index + 1:02d}",
                    "primary": make_entry(),
                }
                for index in range(day_count)
            ],
        },
    }


class TestJourneyAPI(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database = SqliteDatabase(
            Path(self.temp_dir.name) / "test.db"
        )
        app.state.user_repository = InMemoryUserRepository()
        app.state.auth_token_repository = (
            InMemoryAuthTokenRepository()
        )
        app.state.auth_service = AuthService(
            app.state.user_repository,
            app.state.auth_token_repository,
        )
        app.state.journey_service = JourneyService(
            self.database,
            app.state.habit_repository,
        )
        self.client = TestClient(app)
        self.alice = self.register("alice")
        self.bob = self.register("bob")
        self.alice_headers = self.auth_headers(self.alice["token"])
        self.bob_headers = self.auth_headers(self.bob["token"])

    def set_demo_mode(self, enabled):
        app.state.journey_service = JourneyService(
            self.database,
            app.state.habit_repository,
            demo_mode=enabled,
        )

    def tearDown(self):
        self.client.close()
        self.temp_dir.cleanup()

    def register(self, username):
        response = self.client.post(
            "/api/auth/register",
            json={
                "username": username,
                "password": "gentle-steps",
                "display_name": username.title(),
            },
        )
        self.assertEqual(response.status_code, 201)
        return response.json()

    @staticmethod
    def auth_headers(token):
        return {"Authorization": f"Bearer {token}"}

    def create_journey(self, journey=None, revision=0):
        return self.client.put(
            "/api/journeys/current",
            headers=self.alice_headers,
            json={
                "journey": journey or make_journey(),
                "expected_revision": revision,
            },
        )

    def complete(
        self,
        revision,
        key,
        day_id="day-1",
        difficulty="easy",
        enjoyment="okay",
        simulated_at=None,
    ):
        payload = {
            "day_id": day_id,
            "slot": "primary",
            "expected_revision": revision,
            "feedback": {
                "difficulty": difficulty,
                "barrier": "Nothing in particular",
                "safety": "none",
                "enjoyment": enjoyment,
            },
        }
        if simulated_at is not None:
            payload["simulated_at"] = simulated_at

        return self.client.post(
            "/api/journeys/current/completions",
            headers={
                **self.alice_headers,
                "Idempotency-Key": key,
            },
            json=payload,
        )

    def test_01_create_and_get_journey(self):
        response = self.create_journey()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["revision"], 1)
        self.assertEqual(
            response.json()["journey"]["plan"]["id"],
            "plan-1",
        )

        fetched = self.client.get(
            "/api/journeys/current",
            headers=self.alice_headers,
        )

        self.assertEqual(fetched.status_code, 200)
        self.assertEqual(fetched.json()["revision"], 1)
        self.assertEqual(
            fetched.json()["journey"]["profile"]["primaryGoalId"],
            "movement",
        )

    def test_02_journeys_are_scoped_to_the_signed_in_user(self):
        self.create_journey()

        response = self.client.get(
            "/api/journeys/current",
            headers=self.bob_headers,
        )

        self.assertEqual(response.status_code, 404)

    def test_03_rejects_missing_and_stale_revisions(self):
        self.create_journey()

        missing = self.client.put(
            "/api/journeys/current",
            headers=self.alice_headers,
            json={"journey": make_journey()},
        )
        stale = self.create_journey()

        self.assertEqual(missing.status_code, 428)
        self.assertEqual(stale.status_code, 409)

    def test_04_completion_requires_an_idempotency_key(self):
        self.create_journey()

        response = self.client.post(
            "/api/journeys/current/completions",
            headers=self.alice_headers,
            json={
                "day_id": "day-1",
                "slot": "primary",
                "expected_revision": 1,
                "feedback": {
                    "difficulty": "easy",
                    "barrier": None,
                    "safety": "none",
                },
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_05_completion_progresses_the_next_entry(self):
        self.create_journey(make_journey(day_count=3))

        first = self.complete(1, "complete-first")
        second = self.complete(
            2,
            "complete-second",
            day_id="day-2",
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(
            first.json()["decision"]["action"],
            "maintain",
        )
        self.assertEqual(second.status_code, 200)
        self.assertEqual(
            second.json()["decision"]["action"],
            "increase",
        )
        self.assertEqual(second.json()["revision"], 3)

        next_entry = second.json()["journey"]["plan"]["days"][2][
            "primary"
        ]
        self.assertEqual(next_entry["dose"], 7)
        self.assertEqual(next_entry["progressionLevel"], 2)
        self.assertEqual(
            second.json()["journey"]["plan"]["days"][0]["primary"][
                "status"
            ],
            "completed",
        )

    def test_05b_completion_keeps_enjoyment_feedback(self):
        self.create_journey()

        response = self.complete(
            1,
            "complete-enjoyment",
            enjoyment="loved",
        )

        self.assertEqual(response.status_code, 200)
        entry = response.json()["journey"]["plan"]["days"][0][
            "primary"
        ]
        self.assertEqual(entry["feedback"]["enjoyment"], "loved")

    def test_06_completion_retries_are_idempotent(self):
        self.create_journey()

        first = self.complete(1, "same-request")
        duplicate = self.complete(1, "same-request")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(duplicate.status_code, 200)
        self.assertEqual(
            duplicate.json()["revision"],
            first.json()["revision"],
        )
        self.assertEqual(duplicate.json(), first.json())

        fetched = self.client.get(
            "/api/journeys/current",
            headers=self.alice_headers,
        )
        self.assertEqual(fetched.json()["revision"], 2)

    def test_07_already_resolved_slots_are_rejected(self):
        self.create_journey()
        self.complete(1, "complete-once")

        response = self.complete(2, "complete-again")

        self.assertEqual(response.status_code, 409)

    def test_08_safety_feedback_pauses_the_plan(self):
        self.create_journey()

        response = self.client.post(
            "/api/journeys/current/completions",
            headers={
                **self.alice_headers,
                "Idempotency-Key": "safety-request",
            },
            json={
                "day_id": "day-1",
                "slot": "primary",
                "expected_revision": 1,
                "feedback": {
                    "difficulty": "comfortable",
                    "barrier": "Discomfort or pain",
                    "safety": "pain",
                },
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["decision"]["action"], "safety_pause")
        self.assertTrue(body["journey"]["plan"]["safetyPause"])
        self.assertEqual(
            body["journey"]["plan"]["days"][0]["primary"]["status"],
            "paused",
        )
        self.assertEqual(
            body["journey"]["plan"]["days"][1]["primary"]["dose"],
            3,
        )

    def test_09_reset_deletes_the_journey(self):
        self.create_journey()

        deleted = self.client.delete(
            "/api/journeys/current",
            headers=self.alice_headers,
        )
        fetched = self.client.get(
            "/api/journeys/current",
            headers=self.alice_headers,
        )

        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(fetched.status_code, 404)

    def test_10_rejects_client_supplied_ownership(self):
        journey = make_journey()
        journey["user_id"] = "someone-else"

        response = self.create_journey(journey)

        self.assertEqual(response.status_code, 422)

    def test_11_simulated_timestamps_are_rejected_outside_demo_mode(self):
        self.create_journey()

        response = self.complete(
            1,
            "simulation-disabled",
            simulated_at="2026-11-01T12:00:00+04:00",
        )

        self.assertEqual(response.status_code, 403)
        fetched = self.client.get(
            "/api/journeys/current",
            headers=self.alice_headers,
        )
        entry = fetched.json()["journey"]["plan"]["days"][0][
            "primary"
        ]
        self.assertEqual(entry["status"], "planned")

    def test_12_demo_mode_records_the_simulated_day(self):
        self.set_demo_mode(True)
        self.create_journey(make_journey(day_count=3))

        response = self.complete(
            1,
            "simulation-day-2",
            day_id="day-2",
            simulated_at="2026-11-02T19:30:00+04:00",
        )

        self.assertEqual(response.status_code, 200)
        entry = response.json()["journey"]["plan"]["days"][1][
            "primary"
        ]
        self.assertEqual(entry["status"], "completed")
        self.assertTrue(
            entry["completedAt"].startswith("2026-11-02T19:30:00")
        )

    def test_13_demo_mode_rejects_a_date_mismatch(self):
        self.set_demo_mode(True)
        self.create_journey()

        response = self.complete(
            1,
            "simulation-mismatch",
            simulated_at="2026-11-03T12:00:00+04:00",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "Demo date must match the selected journey day.",
        )


class TestDurableAuth(unittest.TestCase):
    def test_accounts_and_sessions_survive_an_app_restart(self):
        from main import create_app

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "auth.db"
            first_app = create_app(path)
            first_client = TestClient(first_app)

            registered = first_client.post(
                "/api/auth/register",
                json={
                    "username": "alice",
                    "password": "gentle-steps",
                    "display_name": "Alice",
                },
            )
            self.assertEqual(registered.status_code, 201)
            token = registered.json()["token"]
            first_client.close()

            second_app = create_app(path)
            second_client = TestClient(second_app)
            me = second_client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            login = second_client.post(
                "/api/auth/login",
                json={
                    "username": "alice",
                    "password": "gentle-steps",
                },
            )

            self.assertEqual(me.status_code, 200)
            self.assertEqual(login.status_code, 200)
            second_client.close()

import unittest

from fastapi.testclient import TestClient

from main import app
from app.repositories.activity_repository import (
    InMemoryActivityRepository,
)
from app.repositories.auth_token_repository import (
    InMemoryAuthTokenRepository,
)
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService


class TestActivityAPI(unittest.TestCase):

    def setUp(self):
        app.state.activity_repository = InMemoryActivityRepository()
        app.state.user_repository = InMemoryUserRepository()
        app.state.auth_token_repository = InMemoryAuthTokenRepository()
        app.state.auth_service = AuthService(
            app.state.user_repository,
            app.state.auth_token_repository,
        )
        self.client = TestClient(app)
        self.alice = self.register("alice")
        self.bob = self.register("bob")
        self.alice_headers = self.auth_headers(self.alice["token"])
        self.bob_headers = self.auth_headers(self.bob["token"])

    def tearDown(self):
        self.client.close()

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

    def auth_headers(self, token):
        return {"Authorization": f"Bearer {token}"}

    def test_01_create_manual_walking_activity(self):
        user_id = self.alice["user"]["user_id"]

        response = self.client.post(
            "/api/activities",
            headers=self.alice_headers,
            json={
                "user_id": user_id,
                "activity_type": "walking",
                "source": "manual",
                "duration_minutes": 5,
            },
        )

        self.assertEqual(response.status_code, 201)

        data = response.json()

        self.assertEqual(data["user_id"], user_id)
        self.assertEqual(data["activity_type"], "walking")
        self.assertEqual(data["duration_minutes"], 5)
        self.assertTrue(data["observation_id"])

    def test_02_retrieve_user_activity_history(self):
        alice_id = self.alice["user"]["user_id"]
        bob_id = self.bob["user"]["user_id"]

        self.client.post(
            "/api/activities",
            headers=self.alice_headers,
            json={
                "user_id": alice_id,
                "activity_type": "walking",
                "source": "manual",
                "duration_minutes": 5,
            },
        )

        self.client.post(
            "/api/activities",
            headers=self.bob_headers,
            json={
                "user_id": bob_id,
                "activity_type": "walking",
                "source": "manual",
                "duration_minutes": 15,
            },
        )

        response = self.client.get(
            f"/api/users/{alice_id}/activities",
            headers=self.alice_headers,
        )

        self.assertEqual(response.status_code, 200)

        activities = response.json()

        self.assertEqual(len(activities), 1)
        self.assertEqual(activities[0]["user_id"], alice_id)
        self.assertEqual(activities[0]["duration_minutes"], 5)

    def test_03_reject_activity_without_measurements(self):
        response = self.client.post(
            "/api/activities",
            headers=self.alice_headers,
            json={
                "user_id": self.alice["user"]["user_id"],
                "activity_type": "walking",
                "source": "manual",
            },
        )

        self.assertEqual(response.status_code, 422)

    def test_04_reject_duplicate_sensor_event(self):
        payload = {
            "user_id": self.alice["user"]["user_id"],
            "activity_type": "walking",
            "source": "mobile_sensor",
            "duration_minutes": 10,
            "source_event_id": "sensor_event_001",
        }

        first_response = self.client.post(
            "/api/activities",
            headers=self.alice_headers,
            json=payload,
        )

        second_response = self.client.post(
            "/api/activities",
            headers=self.alice_headers,
            json=payload,
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 409)

    def test_05_activity_endpoints_require_authentication(self):
        get_response = self.client.get(
            f"/api/users/{self.alice['user']['user_id']}/activities"
        )
        post_response = self.client.post(
            "/api/activities",
            json={
                "user_id": self.alice["user"]["user_id"],
                "activity_type": "walking",
                "source": "manual",
                "duration_minutes": 5,
            },
        )

        self.assertEqual(get_response.status_code, 401)
        self.assertEqual(post_response.status_code, 401)

    def test_06_users_cannot_access_each_others_activity_data(self):
        alice_id = self.alice["user"]["user_id"]

        read_response = self.client.get(
            f"/api/users/{alice_id}/activities",
            headers=self.bob_headers,
        )
        write_response = self.client.post(
            "/api/activities",
            headers=self.bob_headers,
            json={
                "user_id": alice_id,
                "activity_type": "walking",
                "source": "manual",
                "duration_minutes": 5,
            },
        )

        self.assertEqual(read_response.status_code, 403)
        self.assertEqual(write_response.status_code, 403)


if __name__ == "__main__":
    unittest.main()

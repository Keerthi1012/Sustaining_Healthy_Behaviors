import unittest

from fastapi.testclient import TestClient

from main import app
from app.repositories.auth_token_repository import (
    InMemoryAuthTokenRepository,
)
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService


class TestAuthAPI(unittest.TestCase):

    def setUp(self):
        app.state.user_repository = InMemoryUserRepository()
        app.state.auth_token_repository = InMemoryAuthTokenRepository()
        app.state.auth_service = AuthService(
            app.state.user_repository,
            app.state.auth_token_repository,
        )
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()

    def register(
        self,
        username="alice",
        password="gentle-steps",
        display_name="Alice",
    ):
        return self.client.post(
            "/api/auth/register",
            json={
                "username": username,
                "password": password,
                "display_name": display_name,
            },
        )

    def auth_headers(self, token):
        return {"Authorization": f"Bearer {token}"}

    def test_01_register_returns_a_session_and_public_user(self):
        response = self.register()

        self.assertEqual(response.status_code, 201)

        data = response.json()
        self.assertTrue(data["token"])
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["username"], "alice")
        self.assertEqual(data["user"]["display_name"], "Alice")
        self.assertTrue(data["user"]["user_id"])

    def test_02_usernames_are_unique_and_case_insensitive(self):
        self.assertEqual(self.register(username="Alice").status_code, 201)

        response = self.register(username="alice")

        self.assertEqual(response.status_code, 409)
        self.assertIn("already taken", response.json()["detail"])

    def test_03_login_accepts_valid_credentials(self):
        self.register()

        response = self.client.post(
            "/api/auth/login",
            json={
                "username": "ALICE",
                "password": "gentle-steps",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["token"])

    def test_04_login_rejects_invalid_credentials(self):
        self.register()

        response = self.client.post(
            "/api/auth/login",
            json={
                "username": "alice",
                "password": "not-the-password",
            },
        )

        self.assertEqual(response.status_code, 401)

    def test_05_me_requires_a_valid_bearer_token(self):
        unauthorized = self.client.get("/api/auth/me")
        invalid = self.client.get(
            "/api/auth/me",
            headers=self.auth_headers("not-a-token"),
        )
        session = self.register().json()
        authorized = self.client.get(
            "/api/auth/me",
            headers=self.auth_headers(session["token"]),
        )

        self.assertEqual(unauthorized.status_code, 401)
        self.assertEqual(invalid.status_code, 401)
        self.assertEqual(authorized.status_code, 200)
        self.assertEqual(
            authorized.json()["user_id"],
            session["user"]["user_id"],
        )

    def test_06_logout_revokes_the_session(self):
        session = self.register().json()
        headers = self.auth_headers(session["token"])

        logout_response = self.client.post(
            "/api/auth/logout",
            headers=headers,
        )
        me_response = self.client.get(
            "/api/auth/me",
            headers=headers,
        )

        self.assertEqual(logout_response.status_code, 204)
        self.assertEqual(me_response.status_code, 401)

    def test_07_register_validates_username_and_password(self):
        short_password = self.register(
            username="bob",
            password="short",
        )
        invalid_username = self.register(
            username="not valid",
            password="gentle-steps",
        )

        self.assertEqual(short_password.status_code, 422)
        self.assertEqual(invalid_username.status_code, 422)

    def test_08_display_name_falls_back_to_username(self):
        response = self.register(display_name="   ")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"]["display_name"], "alice")


if __name__ == "__main__":
    unittest.main()

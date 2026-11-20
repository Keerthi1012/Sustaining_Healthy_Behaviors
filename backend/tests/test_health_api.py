import unittest

from fastapi.testclient import TestClient

from main import app


class TestHealthAPI(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()

    def assert_healthy(self, response):
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "healthy")
        self.assertEqual(body["application"], "Habit-RPG")
        self.assertEqual(body["version"], "0.1.0")
        self.assertIsInstance(body["demo_mode"], bool)

    def test_api_health_reports_healthy(self):
        self.assert_healthy(self.client.get("/api/health"))

    def test_health_alias_reports_healthy(self):
        self.assert_healthy(self.client.get("/health"))

    def test_root_welcomes_callers(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "running")

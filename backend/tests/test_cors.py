import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import (
    DEFAULT_CORS_ORIGINS,
    create_app,
    resolve_cors_origins,
)


class TestCORSConfiguration(unittest.TestCase):

    def client_with_origins(self, value=None, absent=False):
        if absent:
            env_patch = patch.dict(os.environ)
        else:
            env_patch = patch.dict(os.environ, {"CORS_ORIGINS": value})

        with env_patch:
            if absent:
                os.environ.pop("CORS_ORIGINS", None)
            application = create_app(database_path=":memory:")

        client = TestClient(application)
        self.addCleanup(client.close)
        return client

    def test_resolve_keeps_exact_origins_and_filters_invalid_entries(self):
        with patch.dict(
            os.environ,
            {
                "CORS_ORIGINS": (
                    " https://frontend.example , , "
                    "https://frontend.example , *"
                )
            },
        ):
            self.assertEqual(
                resolve_cors_origins(),
                ["https://frontend.example"],
            )

    def test_configured_frontend_origin_is_allowed(self):
        client = self.client_with_origins("https://frontend.example")

        response = client.get(
            "/api/health",
            headers={"Origin": "https://frontend.example"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "https://frontend.example",
        )
        self.assertEqual(
            response.headers.get("access-control-allow-credentials"),
            "true",
        )

    def test_unlisted_origin_is_rejected(self):
        client = self.client_with_origins("https://frontend.example")

        response = client.get(
            "/api/health",
            headers={"Origin": "https://unlisted.example"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(
            "access-control-allow-origin",
            response.headers,
        )

    def test_localhost_defaults_work_when_variable_is_absent(self):
        client = self.client_with_origins(absent=True)

        for origin in DEFAULT_CORS_ORIGINS:
            with self.subTest(origin=origin):
                response = client.get(
                    "/api/health",
                    headers={"Origin": origin},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response.headers.get("access-control-allow-origin"),
                    origin,
                )

    def test_preflight_works_for_configured_origin(self):
        client = self.client_with_origins("https://frontend.example")

        response = client.options(
            "/api/health",
            headers={
                "Origin": "https://frontend.example",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": (
                    "authorization,content-type"
                ),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "https://frontend.example",
        )
        self.assertIn(
            "GET",
            response.headers.get("access-control-allow-methods", ""),
        )
        allowed_headers = response.headers.get(
            "access-control-allow-headers",
            "",
        ).lower()
        self.assertIn("authorization", allowed_headers)
        self.assertIn("content-type", allowed_headers)
        self.assertEqual(
            response.headers.get("access-control-allow-credentials"),
            "true",
        )

    def test_wildcard_is_not_allowed_with_credentials(self):
        client = self.client_with_origins("*")

        response = client.get(
            "/api/health",
            headers={"Origin": "https://unlisted.example"},
        )

        self.assertNotIn(
            "access-control-allow-origin",
            response.headers,
        )

        default_response = client.get(
            "/api/health",
            headers={"Origin": DEFAULT_CORS_ORIGINS[0]},
        )
        self.assertEqual(
            default_response.headers.get("access-control-allow-origin"),
            DEFAULT_CORS_ORIGINS[0],
        )

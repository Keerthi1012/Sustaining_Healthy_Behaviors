import os
from pathlib import Path

from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from app.api.activity import router as activity_router
from app.api.auth import router as auth_router
from app.api.habits import router as habits_router
from app.api.journeys import router as journeys_router
from app.repositories.activity_repository import (
    InMemoryActivityRepository,
)
from app.repositories.habit_repository import HabitRepository
from app.repositories.sqlite_auth_token_repository import (
    SqliteAuthTokenRepository,
)
from app.repositories.sqlite_user_habit_repository import (
    SqliteUserHabitRepository,
)
from app.repositories.sqlite_user_repository import (
    SqliteUserRepository,
)
from app.services.auth_service import AuthService
from app.services.journey_service import JourneyService
from app.storage.database import SqliteDatabase


load_dotenv()


DEFAULT_DATABASE_PATH = (
    Path(__file__).resolve().parent / "data" / "sproutly.db"
)


def create_app(
    database_path: str | Path | None = None,
    demo_mode: bool | None = None,
) -> FastAPI:
    application = FastAPI(
        title="Habit-RPG API",
        description="Backend API for the Habit-RPG application",
        version="0.1.0",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    resolved_path = (
        database_path
        or os.getenv("HABIT_RPG_DB_PATH")
        or DEFAULT_DATABASE_PATH
    )
    database = SqliteDatabase(resolved_path)
    habit_repository = HabitRepository()
    resolved_demo_mode = (
        demo_mode
        if demo_mode is not None
        else os.getenv("HABIT_RPG_DEMO_MODE", "")
        .strip()
        .lower()
        == "true"
    )

    application.state.database = database
    application.state.demo_mode = resolved_demo_mode
    application.state.activity_repository = (
        InMemoryActivityRepository()
    )
    application.state.habit_repository = habit_repository
    application.state.user_repository = SqliteUserRepository(database)
    application.state.auth_token_repository = (
        SqliteAuthTokenRepository(database)
    )
    application.state.user_habit_repository = (
        SqliteUserHabitRepository(database)
    )
    application.state.auth_service = AuthService(
        application.state.user_repository,
        application.state.auth_token_repository,
    )
    application.state.journey_service = JourneyService(
        database,
        habit_repository,
        demo_mode=resolved_demo_mode,
    )

    application.include_router(auth_router)
    application.include_router(activity_router)
    application.include_router(habits_router)
    application.include_router(journeys_router)

    @application.get("/")
    def root():
        return {
            "message": "Welcome to Habit-RPG API",
            "status": "running",
        }

    @application.get("/api/health")
    @application.get("/health")
    def health_check():
        return {
            "status": "healthy",
            "application": "Habit-RPG",
            "version": "0.1.0",
            "demo_mode": resolved_demo_mode,
        }

    return application


app = create_app()

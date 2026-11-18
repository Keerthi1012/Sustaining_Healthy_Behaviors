from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Request,
    Response,
    status,
)

from app.api.dependencies import AuthContext, get_auth_context
from app.models.journey import (
    CompletionRequest,
    JourneyUpdateRequest,
)
from app.repositories.journey_repository import (
    JourneyNotFoundError,
    JourneyRevisionConflictError,
    JourneyRevisionRequiredError,
)
from app.services.journey_service import (
    JourneyService,
    JourneySlotNotFoundError,
    JourneySlotResolvedError,
)


router = APIRouter(tags=["Journeys"])


def get_journey_service(request: Request) -> JourneyService:
    service = getattr(request.app.state, "journey_service", None)

    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Journey storage is not available.",
        )

    return service


@router.get("/api/journeys/current")
def get_current_journey(
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
):
    record = get_journey_service(request).get(auth.user.user_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No journey has been saved yet.",
        )

    return {
        "journey": record.journey,
        "revision": record.revision,
    }


@router.put("/api/journeys/current")
def save_current_journey(
    payload: JourneyUpdateRequest,
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
):
    try:
        record = get_journey_service(request).save(
            auth.user.user_id,
            payload.journey.model_dump(by_alias=True),
            payload.expected_revision,
        )
    except JourneyRevisionRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="A journey revision is required.",
        ) from exc
    except JourneyRevisionConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The journey was changed elsewhere.",
        ) from exc

    return {
        "journey": record.journey,
        "revision": record.revision,
    }


@router.delete(
    "/api/journeys/current",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_current_journey(
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
):
    get_journey_service(request).delete(auth.user.user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/api/journeys/current/completions")
def complete_current_journey_slot(
    payload: CompletionRequest,
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
    idempotency_key: str | None = Header(
        default=None,
        alias="Idempotency-Key",
    ),
):
    if (
        idempotency_key is None
        or len(idempotency_key.strip()) < 8
        or len(idempotency_key) > 128
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid Idempotency-Key header is required.",
        )

    try:
        return get_journey_service(request).complete_slot(
            auth.user.user_id,
            payload,
            idempotency_key.strip(),
        )
    except JourneyNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No journey has been saved yet.",
        ) from exc
    except JourneySlotNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That journey step was not found.",
        ) from exc
    except JourneySlotResolvedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That journey step is no longer planned.",
        ) from exc
    except JourneyRevisionConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The journey was changed elsewhere.",
        ) from exc

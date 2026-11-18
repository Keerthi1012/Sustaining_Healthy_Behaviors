
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import AuthContext, get_auth_context
from app.models.activity import ActivityObservation


router = APIRouter(tags=["Activities"])


@router.post(
    "/api/activities",
    response_model=ActivityObservation,
    status_code=status.HTTP_201_CREATED,
)
def create_activity(
    observation: ActivityObservation,
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
):
    if observation.user_id != auth.user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Activity does not belong to the signed-in user",
        )

    repository = request.app.state.activity_repository

    try:
        repository.add(observation)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return repository.get_by_id(observation.observation_id)


@router.get(
    "/api/users/{user_id}/activities",
    response_model=list[ActivityObservation],
)
def get_user_activities(
    user_id: str,
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
):
    if user_id != auth.user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Activity history does not belong to the signed-in user",
        )

    repository = request.app.state.activity_repository

    return repository.list_by_user(user_id)

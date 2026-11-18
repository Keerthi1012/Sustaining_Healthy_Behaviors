from app.models.activity import ActivityObservation


class InMemoryActivityRepository:

    def __init__(self):
        self._observations: dict[str, ActivityObservation] = {}
        self._source_event_keys: set[tuple[str, str, str]] = set()

    def add(self, observation: ActivityObservation) -> None:
        observation_id = observation.observation_id

        if observation_id in self._observations:
            raise ValueError("Activity observation already exists")

        if observation.source_event_id:
            event_key = (
                observation.user_id,
                observation.source.value,
                observation.source_event_id,
            )

            if event_key in self._source_event_keys:
                raise ValueError("Activity source event already exists")

        else:
            event_key = None

        # Validate before changing repository data.
        self._observations[observation_id] = (
            observation.model_copy(deep=True)
        )

        if event_key:
            self._source_event_keys.add(event_key)

    def get_by_id(self, observation_id: str) -> ActivityObservation:
        if observation_id not in self._observations:
            raise KeyError(
                f"Activity observation not found: {observation_id}"
            )

        return self._observations[observation_id].model_copy(deep=True)

    def list_by_user(self, user_id: str) -> list[ActivityObservation]:
        return [
            item.model_copy(deep=True)
            for item in self._observations.values()
            if item.user_id == user_id
        ]
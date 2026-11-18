
from enum import Enum


class HealthDomain(str, Enum):
    MOVEMENT = "movement"
    NUTRITION = "nutrition"
    SLEEP = "sleep"
    SMOKING = "smoking"


class COMBComponent(str, Enum):
    PHYSICAL_CAPABILITY = "physical_capability"
    PSYCHOLOGICAL_CAPABILITY = "psychological_capability"
    PHYSICAL_OPPORTUNITY = "physical_opportunity"
    SOCIAL_OPPORTUNITY = "social_opportunity"
    REFLECTIVE_MOTIVATION = "reflective_motivation"
    AUTOMATIC_MOTIVATION = "automatic_motivation"


class TrackingMethod(str, Enum):
    MANUAL = "manual"
    STEP_SENSOR = "step_sensor"
    WEARABLE = "wearable"


class HabitStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class FeedbackDifficulty(str, Enum):
    EASY = "easy"
    COMFORTABLE = "comfortable"
    DIFFICULT = "difficult"
    UNCOMFORTABLE = "uncomfortable"

class TargetMetric(str, Enum):
    DURATION_MINUTES = "duration_minutes"
    STEPS = "steps"
    DISTANCE_METERS = "distance_meters"
    CALORIES_KCAL = "calories_kcal"

class SafetySignal(str, Enum):
    NONE = "none"
    PAIN = "pain"
    CONCERNING_SYMPTOM = "concerning_symptom"

class ActivityType(str, Enum):
    WALKING = "walking"
    RUNNING = "running"
    CYCLING = "cycling"
    OTHER = "other"


class ActivitySource(str, Enum):
    MANUAL = "manual"
    MOBILE_SENSOR = "mobile_sensor"
    WEARABLE = "wearable"


class ActivityIntensity(str, Enum):
    UNKNOWN = "unknown"
    LIGHT = "light"
    MODERATE = "moderate"
    VIGOROUS = "vigorous"

class ActivityReviewStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    UNRESOLVED = "unresolved"
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.common import HealthDomain
from app.models.habit import Habit


class EvidenceSource(BaseModel):
    """A traceable source behind the clinical content of a catalog."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(
        pattern=r"^[a-z0-9][a-z0-9-]*$",
        min_length=1,
        max_length=60,
    )
    source: str = Field(min_length=1, max_length=160)
    year: int = Field(ge=1900, le=2100)
    claim: str = Field(min_length=1, max_length=300)


class CatalogBoundaries(BaseModel):
    """Structured limits that must accompany a health domain's content."""

    model_config = ConfigDict(extra="forbid")

    not_for: list[str] = Field(min_length=1)
    seek_help_if: list[str] = Field(min_length=1)
    population_exclusions: list[str] = Field(default_factory=list)


class SafetySignalRule(BaseModel):
    """A domain-specific safety signal and the response it requires."""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(
        pattern=r"^[a-z0-9_]+$",
        min_length=1,
        max_length=60,
    )
    label: str = Field(min_length=1, max_length=80)
    guidance: str = Field(min_length=1, max_length=240)


class CatalogSafetyRules(BaseModel):
    """Screening prompts and signal handling for a health domain."""

    model_config = ConfigDict(extra="forbid")

    screening: list[str] = Field(min_length=1)
    signals: list[SafetySignalRule] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_signal_codes(self):
        codes = [signal.code for signal in self.signals]

        if len(codes) != len(set(codes)):
            raise ValueError("Safety signal codes must be unique")

        return self


class HabitCatalog(BaseModel):
    """A reviewed, versioned habit catalog for one health domain."""

    model_config = ConfigDict(extra="forbid")

    schema_version: str = Field(min_length=1, max_length=20)
    catalog_version: str = Field(
        pattern=r"^\d+\.\d+\.\d+$",
        min_length=1,
        max_length=20,
    )
    domain: HealthDomain

    reviewed_at: date
    reviewed_by: str = Field(min_length=1, max_length=120)
    review_status: str = Field(min_length=1, max_length=40)
    expires_at: date

    evidence: list[EvidenceSource] = Field(min_length=1)
    boundaries: CatalogBoundaries
    safety_rules: CatalogSafetyRules

    habits: list[Habit] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_catalog(self):
        if self.expires_at <= self.reviewed_at:
            raise ValueError(
                "Catalog expiry must be after the review date"
            )

        evidence_ids = [source.id for source in self.evidence]

        if len(evidence_ids) != len(set(evidence_ids)):
            raise ValueError("Evidence source IDs must be unique")

        return self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BehaviourChangeTechnique(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bct_id: str = Field(pattern=r"^\d+\.\d+$")

    cluster_id: int = Field(ge=1)
    cluster_name: str = Field(min_length=1)

    label: str = Field(min_length=1)
    definition: str = Field(min_length=1)


class BCTRegistry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: str
    taxonomy_name: str
    taxonomy_version: str
    source_url: str

    techniques: list[BehaviourChangeTechnique] = Field(
        min_length=1
    )

    @model_validator(mode="after")
    def validate_unique_ids(self):
        ids = [technique.bct_id for technique in self.techniques]

        if len(ids) != len(set(ids)):
            raise ValueError("BCT IDs must be unique")

        return self
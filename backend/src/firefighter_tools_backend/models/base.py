"""Shared base model for the documented API contract."""

from pydantic import BaseModel, ConfigDict


class ContractModel(BaseModel):
    """Base model that rejects fields outside the documented API contract."""

    model_config = ConfigDict(extra="forbid")

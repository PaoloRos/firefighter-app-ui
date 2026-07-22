"""Public response contract for calendar schedule conversion."""

from enum import StrEnum
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ContractModel(BaseModel):
    """Base model that rejects fields outside the documented API contract."""

    model_config = ConfigDict(extra="forbid")


class ConversionStatus(StrEnum):
    """Outcome of semantic event validation and calendar generation."""

    SUCCESS = "success"
    PARTIAL = "partial"
    FAILURE = "failure"


class IssueCode(StrEnum):
    """Stable frontend-facing code for one invalid event property."""

    EMPTY_ID = "empty_id"
    EMPTY_SUMMARY = "empty_summary"
    END_DATE_BEFORE_START_DATE = "end_date_before_start_date"
    END_TIME_BEFORE_START_TIME = "end_time_before_start_time"
    DUPLICATE_ID = "duplicate_id"


class FatalErrorCode(StrEnum):
    """Stable frontend-facing code for a request-level failure."""

    UNSUPPORTED_FILE_TYPE = "unsupported_file_type"
    OVERSIZED_UPLOAD = "oversized_upload"
    MALFORMED_CSV = "malformed_csv"
    MALFORMED_XLSX = "malformed_xlsx"
    INPUT_READ_ERROR = "input_read_error"
    INTERNAL_ERROR = "internal_error"


class SourcePosition(ContractModel):
    """One-based source location of an event in an uploaded schedule."""

    event_index: int = Field(ge=1)
    row: int = Field(ge=1)
    worksheet: str | None = None


class InvalidEvent(ContractModel):
    """Event omitted from the calendar because semantic validation failed."""

    source_position: SourcePosition
    id: str
    summary: str
    issue_codes: list[IssueCode] = Field(min_length=1)


class Calendar(ContractModel):
    """In-memory calendar returned for a complete or partial conversion."""

    filename: str = Field(min_length=1)
    mime_type: Literal["text/calendar;charset=utf-8"] = (
        "text/calendar;charset=utf-8"
    )
    ics_text: str


class ConversionResponse(ContractModel):
    """Normal response for a semantically evaluated schedule."""

    status: ConversionStatus
    total_count: int = Field(ge=0)
    converted_count: int = Field(ge=0)
    skipped_count: int = Field(ge=0)
    invalid_events: list[InvalidEvent]
    calendar: Calendar | None

    @model_validator(mode="after")
    def validate_outcome(self) -> Self:
        """Reject internally contradictory status, count, and calendar data."""
        if self.total_count != self.converted_count + self.skipped_count:
            raise ValueError(
                "total_count must equal converted_count plus skipped_count"
            )
        if self.skipped_count != len(self.invalid_events):
            raise ValueError(
                "skipped_count must equal the number of invalid_events"
            )

        if self.status is ConversionStatus.SUCCESS:
            if self.skipped_count != 0 or self.calendar is None:
                raise ValueError(
                    "success requires no skipped events and a calendar"
                )
        elif self.status is ConversionStatus.PARTIAL:
            if (
                self.converted_count == 0
                or self.skipped_count == 0
                or self.calendar is None
            ):
                raise ValueError(
                    "partial requires converted and skipped events and a calendar"
                )
        elif self.converted_count != 0 or self.calendar is not None:
            raise ValueError(
                "failure requires no converted events and no calendar"
            )

        return self


class FatalErrorResponse(ContractModel):
    """Safe response body for an HTTP request-level failure."""

    code: FatalErrorCode
    message: str = Field(min_length=1)

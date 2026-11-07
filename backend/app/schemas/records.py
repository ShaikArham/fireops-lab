import re
from datetime import UTC, date, datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

RecordText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=128)]
Identifier = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=64,
        pattern=r"^[\w.-]+$",
    ),
]
AccountToken = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=5,
        max_length=64,
        pattern=r"^SYN-[A-Z0-9-]+$",
    ),
]
AMOUNT_RE = re.compile(r"^[0-9]+$")
FORMULA_PREFIXES = ("=", "+", "-", "@")


class CSVRecord(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, str_strip_whitespace=True)

    @field_validator("*", mode="before")
    @classmethod
    def reject_formula_like_text(cls, value: object) -> object:
        if isinstance(value, str) and value.lstrip().startswith(FORMULA_PREFIXES):
            raise ValueError("formula_like_cell")
        return value


class PaymentInstructionRow(CSVRecord):
    payment_id: Identifier
    client_reference: RecordText
    created_at: datetime
    instructed_at: datetime
    amount_minor: int = Field(ge=1, le=9_223_372_036_854_775_807)
    currency: Literal["EUR", "GBP", "USD"]
    direction: Literal["INBOUND", "OUTBOUND"]
    payer_account_token: AccountToken
    payee_account_token: AccountToken
    scheme: Literal["SEPA_CREDIT", "SEPA_INSTANT"]
    expected_settlement_date: date
    status: Literal["CREATED", "VALIDATED", "PROCESSING", "SETTLED", "FAILED"]
    batch_id: Identifier
    idempotency_key: RecordText

    @field_validator("amount_minor", mode="before")
    @classmethod
    def parse_minor_units(cls, value: object) -> object:
        if isinstance(value, str) and AMOUNT_RE.fullmatch(value):
            return int(value)
        return value

    @field_validator("created_at", "instructed_at", mode="before")
    @classmethod
    def parse_utc_timestamp(cls, value: object) -> object:
        if isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError as error:
                raise ValueError("invalid_timestamp") from error
            if parsed.tzinfo is None or parsed.utcoffset() is None:
                raise ValueError("timestamp_requires_timezone")
            return parsed.astimezone(UTC)
        return value

    @field_validator("expected_settlement_date", mode="before")
    @classmethod
    def parse_expected_settlement_date(cls, value: object) -> object:
        if isinstance(value, str):
            try:
                return date.fromisoformat(value)
            except ValueError as error:
                raise ValueError("invalid_date") from error
        return value

    @model_validator(mode="after")
    def instruction_timestamp_order(self) -> "PaymentInstructionRow":
        if self.instructed_at < self.created_at:
            raise ValueError("instruction_timestamp_before_creation")
        return self


class SettlementRecordRow(CSVRecord):
    settlement_id: Identifier
    scheme_reference: RecordText
    payment_reference: RecordText
    settlement_date: date
    amount_minor: int = Field(ge=1, le=9_223_372_036_854_775_807)
    currency: Literal["EUR", "GBP", "USD"]
    direction: Literal["INBOUND", "OUTBOUND"]
    settlement_batch_id: Identifier

    @field_validator("amount_minor", mode="before")
    @classmethod
    def parse_minor_units(cls, value: object) -> object:
        if isinstance(value, str) and AMOUNT_RE.fullmatch(value):
            return int(value)
        return value

    @field_validator("settlement_date", mode="before")
    @classmethod
    def parse_settlement_date(cls, value: object) -> object:
        if isinstance(value, str):
            try:
                return date.fromisoformat(value)
            except ValueError as error:
                raise ValueError("invalid_date") from error
        return value

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


BookStatus = Literal["To Read", "Reading", "Completed"]

MAX_RATING = 6


class BookBase(BaseModel):
    title: str
    author: str
    status: BookStatus
    pages: int = Field(default=0, ge=0)
    rating: int = Field(default=0, ge=0, le=MAX_RATING)
    cover: str = ""
    started_at: datetime | None = None
    completed_at: datetime | None = None
    current_page: int = Field(default=0, ge=0)


class BookCreate(BookBase):
    model_config = ConfigDict(str_strip_whitespace=True)

    # Only incoming data is validated here, so any older rows that break
    # these rules can still be read back through BookResponse.
    @model_validator(mode="after")
    def check_consistency(self):
        if not self.title:
            raise ValueError("Title is required")

        if not self.author:
            raise ValueError("Author is required")

        if self.pages and self.current_page > self.pages:
            raise ValueError("Current page cannot be greater than the total pages")

        if (
            self.started_at
            and self.completed_at
            and self.completed_at < self.started_at
        ):
            raise ValueError("Completed date cannot be before the started date")

        return self


class BookUpdate(BookCreate):
    pass


class BookResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    genre: str
    reason: str
    cover: str
    pages: int


class SuggestedBook(BaseModel):
    """A recommendation before covers and page counts are looked up."""

    title: str
    author: str
    genre: str
    reason: str


class ReviewCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    body: str = Field(min_length=1, max_length=2000)


class ReviewResponse(BaseModel):
    id: int
    body: str
    created_at: datetime
    user_name: str
    is_mine: bool


# ---------- Accounts ----------

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


def _normalise_email(value: str) -> str:
    return value.strip().lower() if isinstance(value, str) else value


class SignUpRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=40)
    email: str = Field(max_length=254, pattern=EMAIL_PATTERN)
    # Passwords are used exactly as typed (spaces included).
    password: str = Field(min_length=8, max_length=128)

    @field_validator("display_name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value

    _email = field_validator("email", mode="before")(_normalise_email)


class LoginRequest(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)

    _email = field_validator("email", mode="before")(_normalise_email)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    display_name: str
    is_guest: bool

from typing import Literal

from pydantic import BaseModel, Field


class BookBase(BaseModel):
    title: str
    author: str
    status: Literal["To Read", "Reading", "Completed"]
    pages: int = Field(ge=0)
    rating: int = Field(ge=0, le=6)
    cover: str


class BookCreate(BookBase):
    pass


class BookUpdate(BookBase):
    pass


class BookResponse(BookBase):
    id: int

    class Config:
        from_attributes = True
from sqlalchemy import Column, Integer, String
from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    status = Column(String, nullable=False)
    pages = Column(Integer, default=0)
    rating = Column(Integer, default=0)
    cover = Column(String, default="")

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
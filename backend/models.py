from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

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

    current_page = Column(Integer, default=0)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    genre = Column(String, nullable=False, default="")
    reason = Column(String, nullable=False, default="")
    cover = Column(String, default="")
    pages = Column(Integer, default=0)

    # Dismissed recommendations are kept so they are never suggested again.
    dismissed = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, server_default=func.now())

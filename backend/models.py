from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    display_name = Column(String, nullable=False)

    # Argon2 hash; the password itself is never stored.
    password_hash = Column(String, nullable=False)

    # Guests get a placeholder email and an unusable password until they
    # upgrade to a full account (keeping their library).
    is_guest = Column(Boolean, nullable=False, default=False, server_default="false")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class Session(Base):
    """A logged-in browser. Deleting the row logs that browser out."""

    __tablename__ = "sessions"

    # SHA-256 of the token in the reader's cookie, so a leaked database
    # can't be used to take over sessions.
    token_hash = Column(String, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

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
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    genre = Column(String, nullable=False, default="")
    reason = Column(String, nullable=False, default="")
    cover = Column(String, default="")
    pages = Column(Integer, default=0)

    # Dismissed recommendations are kept so they are never suggested again.
    dismissed = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, server_default=func.now())


class Review(Base):
    """A public review of a book (the work, not one reader's copy of it).

    Reviews are matched to books by work_key, so everyone who has the same
    book in their library sees the same reviews.
    """

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    work_key = Column(String, nullable=False, index=True)
    book_title = Column(String, nullable=False)
    book_author = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User")

"""Accounts and sessions, stored in our own database.

- Passwords are hashed with Argon2; the password itself is never stored.
- Logging in creates a random session token, sent to the browser in an
  HttpOnly cookie (JavaScript can't read it). Only a SHA-256 hash of the
  token is stored, so a copy of the database can't be used to log in.
- Failed logins are rate-limited per email and per IP address.
- Guests get a real (but anonymous) account, which they can later upgrade
  to a full account without losing their library.
"""

import hashlib
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db


SESSION_COOKIE = "session"
SESSION_LIFETIME = timedelta(days=30)

# Set COOKIE_SECURE=true when serving over HTTPS so the cookie is never sent
# over plain HTTP. Local development runs on http://localhost, so it's off.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

GUEST_EMAIL_DOMAIN = "guest.invalid"

MAX_FAILED_LOGINS = 5
FAILED_LOGIN_WINDOW_SECONDS = 15 * 60

_hasher = PasswordHasher()

# Checked against when an email doesn't exist, so a login for an unknown
# email takes as long as one with a wrong password (no timing leak).
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------- Login rate limiting ----------


class _LoginThrottle:
    """Remembers recent failed logins in memory (reset when the server restarts)."""

    def __init__(self):
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def _recent(self, key: str) -> deque[float]:
        attempts = self._failures[key]
        cutoff = time.monotonic() - FAILED_LOGIN_WINDOW_SECONDS
        while attempts and attempts[0] < cutoff:
            attempts.popleft()
        return attempts

    def check(self, *keys: str) -> None:
        if any(len(self._recent(key)) >= MAX_FAILED_LOGINS for key in keys):
            raise HTTPException(
                status_code=429,
                detail="Too many failed attempts. Please wait 15 minutes and try again.",
            )

    def record_failure(self, *keys: str) -> None:
        now = time.monotonic()
        for key in keys:
            self._failures[key].append(now)

    def reset(self, *keys: str) -> None:
        for key in keys:
            self._failures.pop(key, None)


_throttle = _LoginThrottle()


# ---------- Sessions ----------


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _start_session(user: models.User, response: Response, db: Session) -> None:
    token = secrets.token_urlsafe(32)

    db.add(
        models.Session(
            token_hash=_hash_token(token),
            user_id=user.id,
            expires_at=datetime.now() + SESSION_LIFETIME,
        )
    )
    db.commit()

    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=int(SESSION_LIFETIME.total_seconds()),
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def _end_session(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """FastAPI dependency: the logged-in reader, or a 401."""
    token = request.cookies.get(SESSION_COOKIE)
    session = db.get(models.Session, _hash_token(token)) if token else None

    if session is None or session.expires_at < datetime.now():
        if session is not None:
            db.delete(session)
            db.commit()
        raise HTTPException(status_code=401, detail="Please log in to continue.")

    return session.user


# ---------- Endpoints ----------


@router.post("/signup", response_model=schemas.UserResponse, status_code=201)
def sign_up(
    details: schemas.SignUpRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    if db.query(models.User).filter(models.User.email == details.email).first():
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Try logging in.",
        )

    user = models.User(
        email=details.email,
        display_name=details.display_name,
        password_hash=_hasher.hash(details.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _start_session(user, response, db)
    return user


@router.post("/login", response_model=schemas.UserResponse)
def log_in(
    credentials: schemas.LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    throttle_keys = (f"email:{credentials.email}", f"ip:{client_ip}")
    _throttle.check(*throttle_keys)

    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    try:
        _hasher.verify(user.password_hash if user else _DUMMY_HASH, credentials.password)
        if user is None:
            raise VerifyMismatchError
    except (VerifyMismatchError, InvalidHashError):
        _throttle.record_failure(*throttle_keys)
        # Same message either way, so it doesn't reveal which emails have accounts.
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    _throttle.reset(*throttle_keys)

    # Upgrade old hashes when Argon2's recommended settings change.
    if _hasher.check_needs_rehash(user.password_hash):
        user.password_hash = _hasher.hash(credentials.password)
        db.commit()

    _start_session(user, response, db)
    return user


@router.post("/guest", response_model=schemas.UserResponse, status_code=201)
def continue_as_guest(response: Response, db: Session = Depends(get_db)):
    user = models.User(
        # ".invalid" is reserved and can never be a real address.
        email=f"guest-{secrets.token_hex(8)}@{GUEST_EMAIL_DOMAIN}",
        display_name="Guest",
        # A random password nobody knows, so a guest can't be logged into.
        password_hash=_hasher.hash(secrets.token_urlsafe(32)),
        is_guest=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _start_session(user, response, db)
    return user


@router.post("/upgrade", response_model=schemas.UserResponse)
def upgrade_guest(
    details: schemas.SignUpRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Turn the current guest into a full account, keeping all their data."""
    if not user.is_guest:
        raise HTTPException(status_code=400, detail="You already have an account.")

    if db.query(models.User).filter(models.User.email == details.email).first():
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    user.email = details.email
    user.display_name = details.display_name
    user.password_hash = _hasher.hash(details.password)
    user.is_guest = False
    db.commit()
    db.refresh(user)

    return user


@router.post("/logout")
def log_out(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        db.query(models.Session).filter(
            models.Session.token_hash == _hash_token(token)
        ).delete()
        db.commit()

    _end_session(response)
    return {"message": "Logged out"}


@router.post("/logout-all")
def log_out_everywhere(
    response: Response,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Session).filter(models.Session.user_id == user.id).delete()
    db.commit()

    _end_session(response)
    return {"message": "Logged out of all devices"}

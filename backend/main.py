import os

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import book_sources
import models
import recommender
import schemas
import auth
from auth import get_current_user
from database import engine, get_db


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Library API")

# Comma-separated list of frontend origins allowed to call the API.
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174",
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def reject_cross_site_writes(request: Request, call_next):
    """Extra CSRF protection on top of SameSite cookies: requests that change
    data must come from one of our own frontend origins."""
    origin = request.headers.get("origin")
    if (
        request.method not in ("GET", "HEAD", "OPTIONS")
        and origin
        and origin not in cors_origins
    ):
        return JSONResponse(status_code=403, content={"detail": "Request blocked: unknown origin."})

    return await call_next(request)


app.include_router(auth.router)


# ---------- Helpers ----------
# Lookups are always scoped to the signed-in reader, so someone else's
# book or recommendation id simply isn't found.


def get_book_or_404(book_id: int, user: models.User, db: Session) -> models.Book:
    book = db.get(models.Book, book_id)

    if book is None or book.user_id != user.id:
        raise HTTPException(status_code=404, detail="Book not found")

    return book


def get_recommendation_or_404(
    recommendation_id: int,
    user: models.User,
    db: Session,
) -> models.Recommendation:
    recommendation = db.get(models.Recommendation, recommendation_id)

    if (
        recommendation is None
        or recommendation.user_id != user.id
        or recommendation.dismissed
    ):
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return recommendation


def active_recommendations(user: models.User, db: Session) -> list[models.Recommendation]:
    return (
        db.query(models.Recommendation)
        .filter(
            models.Recommendation.user_id == user.id,
            models.Recommendation.dismissed.is_(False),
        )
        .order_by(models.Recommendation.id)
        .all()
    )


def review_response(review: models.Review, user: models.User) -> schemas.ReviewResponse:
    return schemas.ReviewResponse(
        id=review.id,
        body=review.body,
        created_at=review.created_at,
        user_name=review.user.display_name,
        is_mine=review.user_id == user.id,
    )


# ---------- General ----------


@app.get("/")
def root():
    return {"message": "Personal Library API is running"}


@app.get("/me", response_model=schemas.UserResponse)
def get_me(user: models.User = Depends(get_current_user)):
    return user


# ---------- Books ----------


@app.get("/books", response_model=list[schemas.BookResponse])
def get_books(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Book)
        .filter(models.Book.user_id == user.id)
        .order_by(models.Book.id)
        .all()
    )


# Declared before the /books/{book_id} routes so "search" isn't read as an id.
@app.get("/books/search", response_model=list[book_sources.BookDetails])
def search_books(q: str, user: models.User = Depends(get_current_user)):
    query = q.strip()
    return book_sources.search_books(query) if query else []


@app.post("/books", response_model=schemas.BookResponse, status_code=201)
def add_book(
    book: schemas.BookCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_book = models.Book(**book.model_dump(), user_id=user.id)

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return new_book


@app.put("/books/{book_id}", response_model=schemas.BookResponse)
def update_book(
    book_id: int,
    updated_book: schemas.BookUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = get_book_or_404(book_id, user, db)

    for field, value in updated_book.model_dump().items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)

    return book


@app.delete("/books/{book_id}")
def delete_book(
    book_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = get_book_or_404(book_id, user, db)

    db.delete(book)
    db.commit()

    return {"message": "Book deleted successfully"}


@app.get("/books/{book_id}/details", response_model=book_sources.BookInfo)
def get_book_details(
    book_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = get_book_or_404(book_id, user, db)
    return book_sources.describe_book(book.title, book.author)


# ---------- Reviews (public: shared by everyone with the same book) ----------


@app.get("/books/{book_id}/reviews", response_model=list[schemas.ReviewResponse])
def get_reviews(
    book_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = get_book_or_404(book_id, user, db)

    reviews = (
        db.query(models.Review)
        .filter(models.Review.work_key == book_sources.work_key(book.title, book.author))
        .order_by(models.Review.created_at.desc())
        .all()
    )

    return [review_response(review, user) for review in reviews]


@app.post(
    "/books/{book_id}/reviews",
    response_model=schemas.ReviewResponse,
    status_code=201,
)
def add_review(
    book_id: int,
    review: schemas.ReviewCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = get_book_or_404(book_id, user, db)

    new_review = models.Review(
        user_id=user.id,
        work_key=book_sources.work_key(book.title, book.author),
        book_title=book.title,
        book_author=book.author,
        body=review.body,
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return review_response(new_review, user)


@app.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.get(models.Review, review_id)

    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")

    db.delete(review)
    db.commit()

    return {"message": "Review deleted successfully"}


# ---------- Recommendations ----------


@app.get("/recommendations/engine")
def get_recommendation_engine():
    return {"engine": recommender.current_engine()}


@app.get("/recommendations", response_model=list[schemas.RecommendationResponse])
def get_recommendations(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return active_recommendations(user, db)


@app.post(
    "/recommendations/refresh",
    response_model=list[schemas.RecommendationResponse],
)
def refresh_recommendations(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    books = db.query(models.Book).filter(models.Book.user_id == user.id).all()
    dismissed_titles = [
        title
        for (title,) in db.query(models.Recommendation.title).filter(
            models.Recommendation.user_id == user.id,
            models.Recommendation.dismissed.is_(True),
        )
    ]

    try:
        new_recommendations = recommender.generate_recommendations(books, dismissed_titles)
    except recommender.RecommendationError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    for recommendation in new_recommendations:
        recommendation.user_id = user.id

    # Replace the current batch; dismissed rows stay so they aren't suggested again.
    db.query(models.Recommendation).filter(
        models.Recommendation.user_id == user.id,
        models.Recommendation.dismissed.is_(False),
    ).delete()
    db.add_all(new_recommendations)
    db.commit()

    return active_recommendations(user, db)


@app.post("/recommendations/{recommendation_id}/dismiss")
def dismiss_recommendation(
    recommendation_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recommendation = get_recommendation_or_404(recommendation_id, user, db)

    recommendation.dismissed = True
    db.commit()

    return {"message": "Recommendation dismissed"}


@app.post(
    "/recommendations/{recommendation_id}/add",
    response_model=schemas.BookResponse,
    status_code=201,
)
def add_recommendation_to_library(
    recommendation_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recommendation = get_recommendation_or_404(recommendation_id, user, db)

    book = models.Book(
        user_id=user.id,
        title=recommendation.title,
        author=recommendation.author,
        status="To Read",
        pages=recommendation.pages,
        rating=0,
        cover=recommendation.cover,
        current_page=0,
    )

    db.add(book)
    db.delete(recommendation)
    db.commit()
    db.refresh(book)

    return book

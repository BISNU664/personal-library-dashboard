import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import book_sources
import models
import recommender
import schemas
from database import engine, get_db


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Library API")

# Comma-separated list of frontend origins allowed to call the API.
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_book_or_404(book_id: int, db: Session) -> models.Book:
    book = db.get(models.Book, book_id)

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    return book


@app.get("/")
def root():
    return {"message": "Personal Library API is running"}


@app.get("/books", response_model=list[schemas.BookResponse])
def get_books(db: Session = Depends(get_db)):
    return db.query(models.Book).order_by(models.Book.id).all()


# Declared before the /books/{book_id} routes so "search" isn't read as an id.
@app.get("/books/search", response_model=list[book_sources.BookDetails])
def search_books(q: str):
    query = q.strip()
    return book_sources.search_books(query) if query else []


@app.post("/books", response_model=schemas.BookResponse, status_code=201)
def add_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    new_book = models.Book(**book.model_dump())

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return new_book


@app.put("/books/{book_id}", response_model=schemas.BookResponse)
def update_book(
    book_id: int,
    updated_book: schemas.BookUpdate,
    db: Session = Depends(get_db),
):
    book = get_book_or_404(book_id, db)

    for field, value in updated_book.model_dump().items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)

    return book


@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = get_book_or_404(book_id, db)

    db.delete(book)
    db.commit()

    return {"message": "Book deleted successfully"}


def get_recommendation_or_404(recommendation_id: int, db: Session) -> models.Recommendation:
    recommendation = db.get(models.Recommendation, recommendation_id)

    if recommendation is None or recommendation.dismissed:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return recommendation


def active_recommendations(db: Session) -> list[models.Recommendation]:
    return (
        db.query(models.Recommendation)
        .filter(models.Recommendation.dismissed.is_(False))
        .order_by(models.Recommendation.id)
        .all()
    )


@app.get("/recommendations/engine")
def get_recommendation_engine():
    return {"engine": recommender.current_engine()}


@app.get("/recommendations", response_model=list[schemas.RecommendationResponse])
def get_recommendations(db: Session = Depends(get_db)):
    return active_recommendations(db)


@app.post(
    "/recommendations/refresh",
    response_model=list[schemas.RecommendationResponse],
)
def refresh_recommendations(db: Session = Depends(get_db)):
    books = db.query(models.Book).all()
    dismissed_titles = [
        title
        for (title,) in db.query(models.Recommendation.title).filter(
            models.Recommendation.dismissed.is_(True)
        )
    ]

    try:
        new_recommendations = recommender.generate_recommendations(books, dismissed_titles)
    except recommender.RecommendationError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    # Replace the current batch; dismissed rows stay so they aren't suggested again.
    db.query(models.Recommendation).filter(
        models.Recommendation.dismissed.is_(False)
    ).delete()
    db.add_all(new_recommendations)
    db.commit()

    return active_recommendations(db)


@app.post("/recommendations/{recommendation_id}/dismiss")
def dismiss_recommendation(recommendation_id: int, db: Session = Depends(get_db)):
    recommendation = get_recommendation_or_404(recommendation_id, db)

    recommendation.dismissed = True
    db.commit()

    return {"message": "Recommendation dismissed"}


@app.post(
    "/recommendations/{recommendation_id}/add",
    response_model=schemas.BookResponse,
    status_code=201,
)
def add_recommendation_to_library(recommendation_id: int, db: Session = Depends(get_db)):
    recommendation = get_recommendation_or_404(recommendation_id, db)

    book = models.Book(
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

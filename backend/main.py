from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db


models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Personal Library API is running"}


@app.get("/books", response_model=list[schemas.BookResponse])
def get_books(db: Session = Depends(get_db)):
    return db.query(models.Book).all()


@app.post("/books", response_model=schemas.BookResponse)
def add_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    new_book = models.Book(
        title=book.title,
        author=book.author,
        status=book.status,
        pages=book.pages,
        rating=min(book.rating, 6),
        cover=book.cover,
    )

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
    book = db.query(models.Book).filter(models.Book.id == book_id).first()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    book.title = updated_book.title
    book.author = updated_book.author
    book.status = updated_book.status
    book.pages = updated_book.pages
    book.rating = min(updated_book.rating, 6)
    book.cover = updated_book.cover

    db.commit()
    db.refresh(book)

    return book


@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    db.delete(book)
    db.commit()

    return {"message": "Book deleted successfully"}
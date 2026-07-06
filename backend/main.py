from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


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

class BookCreate(BaseModel):
    title: str
    author: str
    status: str
    pages: int
    rating: int
    cover: str

class BookUpdate(BaseModel):
    title: str
    author: str
    status: str
    pages: int
    rating: int
    cover: str

starter_books = [
    {
        "id": 1,
        "title": "Crime and Punishment",
        "author": "Fyodor Dostoevsky",
        "status": "Completed",
        "pages": 671,
        "rating": 5,
        "cover": "/covers/crime-and-punishment.png",
    },
    {
        "id": 2,
        "title": "Red Rising",
        "author": "Pierce Brown",
        "status": "Reading",
        "pages": 430,
        "rating": 5,
        "cover": "/covers/red-rising.png",
    },
    {
        "id": 3,
        "title": "American Psycho",
        "author": "Bret Easton Ellis",
        "status": "To Read",
        "pages": 399,
        "rating": 4,
        "cover": "/covers/american-psycho.png",
    },
]


books = starter_books.copy()


@app.get("/")
def root():
    return {"message": "Personal Library API is running"}


@app.get("/books")
def get_books():
    return books


@app.post("/books")
def add_book(book: BookCreate):
    new_book = {
        "id": len(books) + 1,
        "title": book.title,
        "author": book.author,
        "status": book.status,
        "pages": book.pages,
        "rating": min(book.rating, 6),
        "cover": book.cover,
    }

    books.append(new_book)
    return new_book

@app.delete("/books/{book_id}")
def delete_book(book_id: int):
    global books

    books = [book for book in books if book["id"] != book_id]

    return {"message": "Book deleted successfully"}

@app.put("/books/{book_id}")
def update_book(book_id: int, updated_book: BookUpdate):
    for book in books:
        if book["id"] == book_id:
            book["title"] = updated_book.title
            book["author"] = updated_book.author
            book["status"] = updated_book.status
            book["pages"] = updated_book.pages
            book["rating"] = min(updated_book.rating, 6)
            book["cover"] = updated_book.cover

            return book

    return {"message": "Book not found"}
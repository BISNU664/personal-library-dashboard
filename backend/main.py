from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

books = [
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


@app.get("/")
def root():
    return {"message": "Personal Library API is running"}


@app.get("/books")
def get_books():
    return books
# Personal Library Dashboard

A full-stack web application for managing a personal book collection, tracking reading progress, and visualising reading habits.

## Features

- **Recommendations**: a Pinterest-style feed of books picked for you from your library and ratings. Save picks to your library or dismiss them, and filter by genre. Free by default; add an Anthropic API key for AI picks from Claude
- **Book management**: add, edit and delete books, with covers and details auto-filled from search
- **Reading progress**: track the current page of books you're reading
- **Search, filter and sort** your collection by title, author, status or rating
- **Yearly reading goals**, with progress shown in the library
- **Analytics**: status breakdown, monthly activity and rating distribution per year

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 19, TypeScript, Vite, Recharts |
| Backend  | FastAPI, SQLAlchemy, Pydantic, Anthropic SDK |
| Database | PostgreSQL                          |
| Recommendations | Free: Open Library subjects & authors. Optional AI: Claude (`claude-opus-5`) |
| Book data | Apple Books search (covers) + Open Library (page counts); neither needs a key |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- A running PostgreSQL database

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (use `source venv/bin/activate` on macOS/Linux)
pip install -r requirements.txt

cp .env.example .env           # then set DATABASE_URL
uvicorn main:app --reload
```

Recommendations work for free out of the box. For AI picks from Claude instead, add `ANTHROPIC_API_KEY` to `backend/.env` (keys and credits at https://console.anthropic.com) and restart the backend.

The API runs at http://127.0.0.1:8000, with interactive docs at http://127.0.0.1:8000/docs. Tables are created automatically on first start.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## API

| Method   | Endpoint       | Description        |
| -------- | -------------- | ------------------ |
| `GET`    | `/books`       | List all books     |
| `GET`    | `/books/search?q=` | Search for a book to add (title, author, cover, pages) |
| `POST`   | `/books`       | Add a book         |
| `PUT`    | `/books/{id}`  | Update a book      |
| `DELETE` | `/books/{id}`  | Delete a book      |
| `GET`    | `/recommendations` | Current recommendations |
| `GET`    | `/recommendations/engine` | Which recommender is active: `claude` or `free` |
| `POST`   | `/recommendations/refresh` | Generate a new batch (a few seconds free, up to a minute with Claude) |
| `POST`   | `/recommendations/{id}/add` | Save a recommendation to the library |
| `POST`   | `/recommendations/{id}/dismiss` | Hide a recommendation and never suggest it again |

## Status

In development.

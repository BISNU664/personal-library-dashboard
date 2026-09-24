# Personal Library Dashboard

A full-stack web application for managing a personal book collection, tracking reading progress, and visualising reading habits.

## Features

- **Accounts**: sign up with email and password, or continue as a guest (and upgrade later without losing anything). Every reader's library, ratings and recommendations are private to them
- **Recommendations**: a Pinterest-style feed of books picked for you from your library and ratings. Save picks to your library or dismiss them, and filter by genre. Free by default; add an Anthropic API key for AI picks from Claude
- **Book management**: add, edit and delete books, with covers and details auto-filled from search
- **Book pages**: click any book for a closeup with your stats, its description and genres, and public reviews from every reader of that book
- **Reading progress**: track the current page of books you're reading
- **Search, filter and sort** your collection by title, author, status or rating
- **Yearly reading goals**, with progress shown in the library
- **Analytics**: status breakdown, monthly activity and rating distribution per year

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 19, TypeScript, Vite, Recharts |
| Backend  | FastAPI, SQLAlchemy, Pydantic, Anthropic SDK |
| Auth     | Built in: Argon2 password hashing, HttpOnly session cookies stored in PostgreSQL |
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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards `/api/*` to the backend, so the page and API share one origin and the login cookie just works. (In production, serve both behind the same domain and set `COOKIE_SECURE=true`.)

## API

Apart from `/`, `/recommendations/engine` and the sign-up/log-in endpoints, every endpoint requires a logged-in session cookie and only ever returns that reader's own data (reviews are the one shared resource). Requests that change data are rejected if they come from another website's origin.

| Method   | Endpoint       | Description        |
| -------- | -------------- | ------------------ |
| `POST`   | `/auth/signup` | Create an account (name, email, password) and log in |
| `POST`   | `/auth/login`  | Log in (rate-limited after 5 failed attempts) |
| `POST`   | `/auth/guest`  | Start a guest account |
| `POST`   | `/auth/upgrade` | Turn the current guest into a full account, keeping their data |
| `POST`   | `/auth/logout` | Log out this browser |
| `POST`   | `/auth/logout-all` | Log out every device |
| `GET`    | `/me`          | The logged-in reader's profile |
| `GET`    | `/books`       | List your books    |
| `GET`    | `/books/search?q=` | Search for a book to add (title, author, cover, pages) |
| `POST`   | `/books`       | Add a book         |
| `PUT`    | `/books/{id}`  | Update a book      |
| `DELETE` | `/books/{id}`  | Delete a book      |
| `GET`    | `/books/{id}/details` | Description, genres, first-published year and reader rating |
| `GET`    | `/books/{id}/reviews` | Every reader's reviews of this book |
| `POST`   | `/books/{id}/reviews` | Add a review |
| `DELETE` | `/reviews/{id}` | Delete one of your own reviews |
| `GET`    | `/recommendations` | Current recommendations |
| `GET`    | `/recommendations/engine` | Which recommender is active: `claude` or `free` |
| `POST`   | `/recommendations/refresh` | Generate a new batch (a few seconds free, up to a minute with Claude) |
| `POST`   | `/recommendations/{id}/add` | Save a recommendation to the library |
| `POST`   | `/recommendations/{id}/dismiss` | Hide a recommendation and never suggest it again |

## Status

In development.

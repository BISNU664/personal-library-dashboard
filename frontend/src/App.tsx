import { useEffect, useState } from "react";
import "./App.css";

interface Book {
  id: number;
  title: string;
  author: string;
  status: string;
  pages: number;
  rating: number;
  cover: string;
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books")
      .then((response) => response.json())
      .then((data) => setBooks(data));
  }, []);

  const totalBooks = books.length;
  const readingBooks = books.filter((book) => book.status === "Reading").length;
  const completedBooks = books.filter((book) => book.status === "Completed").length;

  return (
    <div className="app">
      <header className="navbar">
        <div>
          <h1>Personal Library</h1>
          <p>Track your books, progress, and reading goals.</p>
        </div>

        <nav>
          <a href="#">Dashboard</a>
          <a href="#">Library</a>
          <a href="#">Analytics</a>
        </nav>
      </header>

      <main className="container">
        <section className="stats-container">
          <div className="stat-card">
            <h3>Total Books</h3>
            <p>{totalBooks}</p>
          </div>

          <div className="stat-card">
            <h3>Currently Reading</h3>
            <p>{readingBooks}</p>
          </div>

          <div className="stat-card">
            <h3>Completed</h3>
            <p>{completedBooks}</p>
          </div>
        </section>

        <section>
          <div className="section-header">
            <h2>My Books</h2>
            <button>Add Book</button>
          </div>

          <div className="books-container">
            {books.map((book) => (
              <div className="book-card" key={book.id}>
                <img
                  src={book.cover}
                  alt={book.title}
                  className="book-cover"
              />
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <p>{"⭐".repeat(book.rating)}</p>
                <p>{book.pages} pages</p>
                <span className={`status ${book.status.replace(" ", "-")}`}>
                  {book.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
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
interface SearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  edition_count?: number;
  first_publish_year?: number;
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [editingBookId, setEditingBookId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    status: "To Read",
    pages: "",
    rating: "",
    cover: "",
  });

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books")
      .then((response) => response.json())
      .then((data) => setBooks(data));
  }, []);

  const totalBooks = books.length;
  const readingBooks = books.filter((book) => book.status === "Reading").length;
  const completedBooks = books.filter((book) => book.status === "Completed").length;

  const handleAddBook = () => {
    const bookToAdd = {
      title: newBook.title,
      author: newBook.author,
      status: newBook.status,
      pages: newBook.pages ? Number(newBook.pages) : 0,
      rating: Math.min(Number(newBook.rating), 6),
      cover: newBook.cover,
    };

    fetch("http://127.0.0.1:8000/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookToAdd),
    })
      .then((response) => response.json())
      .then((createdBook) => {
        setBooks([...books, createdBook]);

        setNewBook({
          title: "",
          author: "",
          status: "To Read",
          pages: "",
          rating: "",
          cover: "",
        });

        setSearchQuery("");
        setSearchResults([]);
        setShowModal(false);
      });
  };

  const handleUpdateBook = () => {
    if (editingBookId === null) return;

    const updatedBook = {
      title: newBook.title,
      author: newBook.author,
      status: newBook.status,
      pages: newBook.pages ? Number(newBook.pages) : 0,
      rating: Math.min(Number(newBook.rating), 6),
      cover: newBook.cover,
    };

    fetch(`http://127.0.0.1:8000/books/${editingBookId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedBook),
    })
      .then((response) => response.json())
      .then((savedBook) => {
        setBooks(
          books.map((book) =>
            book.id === editingBookId ? savedBook : book
          )
        );

        setEditingBookId(null);

        setNewBook({
          title: "",
          author: "",
          status: "To Read",
          pages: "",
          rating: "",
          cover: "",
        });

        setShowModal(false);
      });
  };

  const handleEditClick = (book: Book) => {
    setEditingBookId(book.id);

    setNewBook({
      title: book.title,
      author: book.author,
      status: book.status,
      pages: String(book.pages),
      rating: String(book.rating),
      cover: book.cover,
    });

    setSearchQuery(book.title);
    setSearchResults([]);
    setShowModal(true);
  };

  const handleDeleteBook = (id: number) => {
  fetch(`http://127.0.0.1:8000/books/${id}`, {
    method: "DELETE",
  }).then(() => {
    setBooks(books.filter((book) => book.id !== id));
  });
};

  const handleSearchBooks = () => {
  if (!searchQuery.trim()) return;

  fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(
      searchQuery
    )}&limit=5`
  )
    .then((response) => response.json())
    .then((data) => setSearchResults(data.docs));
  };

  return (
    <div className="app">
      <header className="navbar">
        <div>
          <h1> Personal Library</h1>
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
            <p className="section-subtitle">Manage your current reading list.</p>
            <button
            onClick={() => {
              setEditingBookId(null);

              setNewBook({
                title: "",
                author: "",
                status: "To Read",
                pages: "",
                rating: "",
                cover: "",
              });

              setSearchQuery("");
              setSearchResults([]);
              setShowModal(true);
            }}
          >
            Add Book
          </button>
          </div>

          <div className="books-container">
            {books.map((book) => (
              <div className="book-card" key={book.id}>

                <button
                  className="delete-button"
                  onClick={() => handleDeleteBook(book.id)}
                >
                <img 
                  src="/covers/bin.png" 
                  alt="Delete" 
                />
                </button>

                <button
                  className="edit-button"
                  onClick={() => handleEditClick(book)}
                >
                  <img src="/covers/edit.png" 
                  alt="Edit" />
                </button>

                <img src={book.cover} alt={book.title} className="book-cover" />
                <h3>{book.title}</h3>
                <p className="book-author">{book.author}</p>
                <p className="book-rating">
                  {"★".repeat(book.rating)}
                  {"☆".repeat(6 - book.rating)}
                </p>
                <p>{book.pages > 0 ? `${book.pages} pages` : "—"}</p>
                <span className={`status ${book.status.replace(" ", "-")}`}>
                  {book.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

{showModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>{editingBookId ? "Edit Book" : "Add New Book"}</h2>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search book title"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button onClick={handleSearchBooks}>Search</button>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results-dropdown">
          {searchResults.map((result) => (
            <button
              type="button"
              className="search-result-option"
              key={result.key}
              onClick={() => {
                setNewBook({
                  title: result.title,
                  author: result.author_name?.[0] || "",
                  status: "To Read",
                  pages: String(result.number_of_pages_median || ""),
                  rating: "",
                  cover: result.cover_i
                    ? `https://covers.openlibrary.org/b/id/${result.cover_i}-M.jpg`
                    : "",
                });

                setSearchResults([]);
                setSearchQuery(result.title);
              }}
            >
              <strong>{result.title}</strong>
              <span>{result.author_name?.[0] || "Unknown author"}</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Title"
        value={newBook.title}
        onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
      />

      <input
        type="text"
        placeholder="Author"
        value={newBook.author}
        onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
      />

      <input
        type="number"
        placeholder="Pages"
        value={newBook.pages}
        onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })}
      />

      <input
        type="number"
        placeholder="Rating out of 6"
        min="0"
        max="6"
        value={newBook.rating}
        onChange={(e) => setNewBook({ ...newBook, rating: e.target.value })}
      />

      {/*      
      <input
        type="text"
        placeholder="Cover image URL"
        value={newBook.cover}
        onChange={(e) => setNewBook({ ...newBook, cover: e.target.value })}
      />  */}
      {newBook.cover && (
        <div className="cover-preview">
          <img src={newBook.cover} alt={newBook.title} />
        </div>
      )}

      <select
        value={newBook.status}
        onChange={(e) => setNewBook({ ...newBook, status: e.target.value })}
      >
        <option>To Read</option>
        <option>Reading</option>
        <option>Completed</option>
      </select>

      <div className="modal-actions">
        <button
            onClick={
                editingBookId
                    ? handleUpdateBook
                    : handleAddBook
            }
        >
            {editingBookId ? "Save Changes" : "Add Book"}
        </button>
        <button className="cancel-button" onClick={() => setShowModal(false)}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default App;
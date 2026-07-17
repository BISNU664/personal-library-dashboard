import { useEffect, useState } from "react";
import "./App.css";
import type { Book, SearchResult } from "./types/book";
import Navbar from "./components/Navbar";
import BookModal from "./components/BookModal";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Analytics from "./pages/Analytics";

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [librarySearch, setLibrarySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Title");

  const [activePage, setActivePage] = useState("Dashboard");
  const currentYear = new Date().getFullYear();

  const [readingGoals, setReadingGoals] = useState<
    Record<number, number>
  >(() => {
    const savedGoals = localStorage.getItem("readingGoals");

    if (savedGoals) {
      try {
        return JSON.parse(savedGoals);
      } catch {
        return { [currentYear]: 20 };
      }
    }

    return { [currentYear]: 20 };
  });

  useEffect(() => {
  localStorage.setItem(
    "readingGoals",
    JSON.stringify(readingGoals)
  );
}, [readingGoals]);

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    status: "To Read",
    pages: "",
    current_page: "",
    rating: "",
    cover: "",
    started_at: "",
    completed_at: "",
  });

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books")
      .then((response) => response.json())
      .then((data) => setBooks(data));
  }, []);

  const totalBooks = books.length;
  const readingBooks = books.filter((book) => book.status === "Reading").length;
  const completedBooks = books.filter(
    (book) => book.status === "Completed"
  ).length;

  const resetBookForm = () => {
    setEditingBookId(null);
    setNewBook({
      title: "",
      author: "",
      status: "To Read",
      pages: "",
      current_page: "",
      rating: "",
      cover: "",
      started_at: "",
      completed_at: "",
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleOpenAddBook = () => {
    resetBookForm();
    setShowModal(true);
  };

  const handleAddBook = () => {
    const bookToAdd = {
      title: newBook.title,
      author: newBook.author,
      status: newBook.status,

      pages: newBook.pages ? Number(newBook.pages) : 0,
      current_page: newBook.current_page
      ? Number(newBook.current_page)
      : 0,

      rating: Math.min(Number(newBook.rating), 6),
      cover: newBook.cover,
      started_at: newBook.started_at || null,
      completed_at: newBook.completed_at || null,
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
        setBooks((currentBooks) => [...currentBooks, createdBook]);
        resetBookForm();
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
      current_page: newBook.current_page
        ? Number(newBook.current_page)
        : 0,

      rating: Math.min(Number(newBook.rating), 6),
      cover: newBook.cover,
      started_at: newBook.started_at || null,
      completed_at: newBook.completed_at || null,
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
        setBooks((currentBooks) =>
          currentBooks.map((book) =>
            book.id === editingBookId ? savedBook : book
          )
        );

        resetBookForm();
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
      current_page: String(book.current_page ?? 0),
      rating: String(book.rating),
      cover: book.cover,
      started_at: book.started_at ? book.started_at.slice(0, 10) : "",
      completed_at: book.completed_at ? book.completed_at.slice(0, 10) : "",
    });

    setSearchQuery(book.title);
    setSearchResults([]);
    setShowModal(true);
  };

  const handleDeleteBook = (id: number) => {
    fetch(`http://127.0.0.1:8000/books/${id}`, {
      method: "DELETE",
    }).then(() => {
      setBooks((currentBooks) =>
        currentBooks.filter((book) => book.id !== id)
      );
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

  const filteredBooks = books
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        book.author.toLowerCase().includes(librarySearch.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || book.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "Title") {
        return a.title.localeCompare(b.title);
      }

      if (sortOption === "Author") {
        return a.author.localeCompare(b.author);
      }

      if (sortOption === "Rating") {
        return b.rating - a.rating;
      }

      return 0;
    });

  return (
    <div className="app">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {activePage === "Dashboard" && (
        <Dashboard
          books={books}
          filteredBooks={filteredBooks}
          totalBooks={totalBooks}
          readingBooks={readingBooks}
          completedBooks={completedBooks}
          readingGoal={readingGoals[currentYear] ?? 20}
          librarySearch={librarySearch}
          setLibrarySearch={setLibrarySearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          onAddBook={handleOpenAddBook}
          onEditBook={handleEditClick}
          onDeleteBook={handleDeleteBook}
        />
      )}

      {activePage === "Library" && (
        <Library
          filteredBooks={filteredBooks}
          librarySearch={librarySearch}
          setLibrarySearch={setLibrarySearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          onAddBook={handleOpenAddBook}
          onEditBook={handleEditClick}
          onDeleteBook={handleDeleteBook}
        />
      )}

      {activePage === "Analytics" && (
        <Analytics books={books} 
                  readingGoals={readingGoals}
                  setReadingGoals={setReadingGoals}
                />
      )}

      {showModal && (
        <BookModal
          editingBookId={editingBookId}
          newBook={newBook}
          setNewBook={setNewBook}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          onSearch={handleSearchBooks}
          onAdd={handleAddBook}
          onUpdate={handleUpdateBook}
          onClose={() => setShowModal(false)}
        />
      )}
          </div>
        );
      }

export default App;

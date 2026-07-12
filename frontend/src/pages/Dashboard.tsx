import type { Book } from "../types/book";
import BookCard from "../components/BookCard";

interface DashboardProps {
  books: Book[];
  filteredBooks: Book[];

  totalBooks: number;
  readingBooks: number;
  completedBooks: number;

  librarySearch: string;
  setLibrarySearch: (value: string) => void;

  statusFilter: string;
  setStatusFilter: (value: string) => void;

  sortOption: string;
  setSortOption: (value: string) => void;

  onAddBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: number) => void;
}

function Dashboard({
  filteredBooks,
  totalBooks,
  readingBooks,
  completedBooks,
  librarySearch,
  setLibrarySearch,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
  onAddBook,
  onEditBook,
  onDeleteBook,
}: DashboardProps) {
  return (
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
          <p className="section-subtitle">
            Manage your current reading list.
          </p>
          <button onClick={onAddBook}>Add Book</button>
        </div>

        <div className="library-controls">
          <input
            type="text"
            placeholder="Search by title or author..."
            value={librarySearch}
            onChange={(e) => setLibrarySearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="To Read">To Read</option>
            <option value="Reading">Reading</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="Title">Sort by title</option>
            <option value="Author">Sort by author</option>
            <option value="Rating">Sort by rating</option>
          </select>
        </div>

        <div className="books-container">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={onEditBook}
              onDelete={onDeleteBook}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
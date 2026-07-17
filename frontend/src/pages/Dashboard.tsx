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

  readingGoal: number;
}

function Dashboard({
  filteredBooks,
  totalBooks,
  readingBooks,
  completedBooks,
  readingGoal,
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
  const goalProgress =
    readingGoal > 0
      ? Math.min(Math.round((completedBooks / readingGoal) * 100), 100)
      : 0;

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

        <div className="stat-card reading-goal-card">
          <h3>Yearly Reading Goal</h3>

          <p className="goal-count">
            {completedBooks} of {readingGoal} books completed
          </p>

          <span className="goal-percentage">
            {goalProgress}% complete
          </span>

          <div
            className="goal-progress-track"
            role="progressbar"
            aria-label="Yearly reading goal progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={goalProgress}
          >
            <div
              className="goal-progress-fill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>My Books</h2>

          <p className="section-subtitle">
            Manage your current reading list.
          </p>

          <button type="button" onClick={onAddBook}>
            Add Book
          </button>
        </div>

        <div className="library-controls">
          <input
            type="text"
            placeholder="Search by title or author..."
            value={librarySearch}
            onChange={(event) => setLibrarySearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="To Read">To Read</option>
            <option value="Reading">Reading</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
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

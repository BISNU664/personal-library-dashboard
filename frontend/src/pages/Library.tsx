import { useMemo, useState } from "react";
import { BOOK_STATUSES, type Book } from "../types/book";
import {
  countByStatus,
  filterAndSortBooks,
  getBookYear,
  percentage,
  type SortOption,
  type StatusFilter,
} from "../utils/books";
import BookPin from "../components/BookPin";
import ChipBar from "../components/ChipBar";
import Masonry from "../components/Masonry";
import { PlusIcon } from "../components/Icons";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";

const STATUS_OPTIONS: StatusFilter[] = ["All", ...BOOK_STATUSES];

interface LibraryProps {
  books: Book[];
  search: string;
  isLoading: boolean;
  readingGoal: number;
  onAddBook: () => void;
  onOpenBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
}

function Library({
  books,
  search,
  isLoading,
  readingGoal,
  onAddBook,
  onOpenBook,
  onEditBook,
  onDeleteBook,
}: LibraryProps) {
  const [status, setStatus] = useState<StatusFilter>("All");
  const [sort, setSort] = useState<SortOption>("Title");

  const visibleBooks = useMemo(
    () => filterAndSortBooks(books, { search, status, sort }),
    [books, search, status, sort]
  );

  const currentYear = new Date().getFullYear();

  // The goal only counts books finished this year, matching the Analytics page.
  const completedThisYear = books.filter(
    (book) => book.status === "Completed" && getBookYear(book) === currentYear
  ).length;

  const goalProgress = percentage(completedThisYear, readingGoal);

  const renderBooks = () => {
    if (isLoading) {
      return <p className="feed-status">Loading your library…</p>;
    }

    if (visibleBooks.length === 0) {
      return (
        <p className="empty-state">
          {books.length === 0
            ? "Your library is empty. Add your first book, or save one from your picks."
            : "No books match your search."}
        </p>
      );
    }

    return (
      <Masonry>
        {visibleBooks.map((book) => (
          <BookPin
            key={book.id}
            book={book}
            onOpen={onOpenBook}
            onEdit={onEditBook}
            onDelete={onDeleteBook}
          />
        ))}
      </Masonry>
    );
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h2>Your library</h2>
          <p className="page-subtitle">Everything you've read, are reading, and want to read.</p>
        </div>

        <button type="button" className="btn btn-with-icon" onClick={onAddBook}>
          <PlusIcon />
          Add book
        </button>
      </div>

      <section className="stats-strip">
        <StatCard label="Total books" value={books.length} />
        <StatCard label="Reading" value={countByStatus(books, "Reading")} />
        <StatCard label="Completed" value={countByStatus(books, "Completed")} />

        <div className="stat-card goal-card">
          <h3>{currentYear} goal</h3>
          <p>
            {completedThisYear}
            <span className="goal-of"> / {readingGoal}</span>
          </p>
          <ProgressBar
            value={goalProgress}
            label={`${currentYear} reading goal progress`}
          />
        </div>
      </section>

      <div className="library-toolbar">
        <ChipBar
          options={STATUS_OPTIONS}
          active={status}
          onSelect={setStatus}
          label="Filter by status"
        />

        <select
          className="sort-select"
          aria-label="Sort books"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOption)}
        >
          <option value="Title">Sort by title</option>
          <option value="Author">Sort by author</option>
          <option value="Rating">Sort by rating</option>
        </select>
      </div>

      {renderBooks()}
    </main>
  );
}

export default Library;

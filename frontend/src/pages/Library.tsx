import type { Book } from "../types/book";
import BookCard from "../components/BookCard";

interface LibraryProps {
  filteredBooks: Book[];

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

function Library({
  filteredBooks,
  librarySearch,
  setLibrarySearch,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
  onAddBook,
  onEditBook,
  onDeleteBook,
}: LibraryProps) {
  return (
    <main className="container">
      <div className="section-header">
        <div>
          <h2>Library</h2>
          <p className="section-subtitle">
            Browse and manage your full collection.
          </p>
        </div>

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
    </main>
  );
}

export default Library;
import type { Book } from "../types/book";

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}



function BookCard({ book, onEdit, onDelete }: BookCardProps) {

const progress =
  book.status === "Reading" && book.pages > 0
    ? Math.min(
        Math.round((book.current_page / book.pages) * 100),
        100
      )
    : 0;

  return (
    <div className="book-card">
      <button
        className="delete-button"
        onClick={() => onDelete(book.id)}
      >
        <img src="/covers/bin.png" alt="Delete" />
      </button>

      <button
        className="edit-button"
        onClick={() => onEdit(book)}
      >
        <img src="/covers/edit.png" alt="Edit" />
      </button>

      <img
        src={book.cover}
        alt={book.title}
        className="book-cover"
      />

      <h3>{book.title}</h3>

      <p className="book-author">
        {book.author}
      </p>

      <p className="book-rating">
        {"★".repeat(book.rating)}
        {"☆".repeat(6 - book.rating)}
      </p>

      <p>
        {book.pages > 0 ? `${book.pages} pages` : "—"}
      </p>

            {book.status === "Reading" && book.pages > 0 && (
        <div className="reading-progress">
          <div className="progress-details">
            <span>
              Page {book.current_page} of {book.pages}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <span className={`status ${book.status.replace(" ", "-")}`}>
        {book.status}
      </span>
    </div>
  );
}

export default BookCard;
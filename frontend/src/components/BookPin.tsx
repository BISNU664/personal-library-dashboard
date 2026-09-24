import { MAX_RATING, type Book } from "../types/book";
import { percentage } from "../utils/books";
import CoverImage from "./CoverImage";
import { PencilIcon, TrashIcon } from "./Icons";
import ProgressBar from "./ProgressBar";

interface BookPinProps {
  book: Book;
  onOpen: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

function BookPin({ book, onOpen, onEdit, onDelete }: BookPinProps) {
  const statusClass = `status-${book.status.toLowerCase().replace(" ", "-")}`;
  const showProgress = book.status === "Reading" && book.pages > 0;
  const progress = percentage(book.current_page, book.pages);

  return (
    <article className="pin">
      <div className="pin-media">
        <button
          type="button"
          className="pin-open"
          onClick={() => onOpen(book)}
          aria-label={`View details for ${book.title}`}
        >
          <CoverImage src={book.cover} title={book.title} author={book.author} />
        </button>

        <div className="pin-overlay">
          <div className="pin-overlay-top" />

          <div className="pin-overlay-bottom pin-overlay-actions">
            <button
              type="button"
              className="pin-icon-button"
              onClick={() => onEdit(book)}
              aria-label={`Edit ${book.title}`}
              title="Edit"
            >
              <PencilIcon />
            </button>

            <button
              type="button"
              className="pin-icon-button pin-icon-danger"
              onClick={() => onDelete(book)}
              aria-label={`Delete ${book.title}`}
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="pin-info">
        <h3>{book.title}</h3>
        <p>{book.author}</p>

        <div className="pin-meta">
          <span className={`status-dot ${statusClass}`}>{book.status}</span>

          {book.rating > 0 && (
            <span
              className="pin-rating"
              aria-label={`Rated ${book.rating} out of ${MAX_RATING}`}
            >
              {"★".repeat(book.rating)}
            </span>
          )}
        </div>

        {showProgress && (
          <div className="pin-progress">
            <ProgressBar
              value={progress}
              label={`Reading progress for ${book.title}`}
            />
            <span>
              p. {book.current_page} / {book.pages}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export default BookPin;

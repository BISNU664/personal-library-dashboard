import { useEffect, useState, type SubmitEvent } from "react";
import {
  createReview,
  deleteReview,
  errorMessage,
  fetchBookInfo,
  fetchReviews,
} from "../api";
import { MAX_RATING, type Book, type BookInfo, type Review } from "../types/book";
import { percentage } from "../utils/books";
import CoverImage from "./CoverImage";
import { CloseIcon, PencilIcon, TrashIcon } from "./Icons";
import Modal from "./Modal";
import ProgressBar from "./ProgressBar";

const DESCRIPTION_PREVIEW_LENGTH = 450;
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string): number {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS));
}

interface BookDetailModalProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onClose: () => void;
}

/** Pinterest-style closeup: cover on the left, stats, about and reviews on the right. */
function BookDetailModal({ book, onEdit, onDelete, onClose }: BookDetailModalProps) {
  const [info, setInfo] = useState<BookInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [draft, setDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    // Ignore responses that arrive after the modal has closed.
    let isCurrent = true;

    fetchBookInfo(book.id)
      .then((result) => isCurrent && setInfo(result))
      .catch(() => {
        // Extra details are optional; the page still shows the book's own stats.
      })
      .finally(() => isCurrent && setIsLoadingInfo(false));

    fetchReviews(book.id)
      .then((result) => isCurrent && setReviews(result))
      .catch((err) => isCurrent && setReviewError(errorMessage(err)))
      .finally(() => isCurrent && setIsLoadingReviews(false));

    return () => {
      isCurrent = false;
    };
  }, [book.id]);

  const handlePostReview = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = draft.trim();
    if (!body) return;

    setIsPosting(true);
    setReviewError(null);

    try {
      const review = await createReview(book.id, body);
      setReviews((current) => [review, ...current]);
      setDraft("");
    } catch (err) {
      setReviewError(errorMessage(err));
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteReview = async (review: Review) => {
    if (!window.confirm("Delete this review?")) return;

    try {
      await deleteReview(review.id);
      setReviews((current) => current.filter((r) => r.id !== review.id));
    } catch (err) {
      setReviewError(errorMessage(err));
    }
  };

  const progress = percentage(book.current_page, book.pages);
  const description = info?.description ?? "";
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_LENGTH;

  const stats: { label: string; value: string }[] = [
    { label: "Your rating", value: book.rating ? `${book.rating} / ${MAX_RATING}` : "Not rated" },
    { label: "Pages", value: book.pages ? book.pages.toLocaleString() : "—" },
    { label: "Started", value: book.started_at ? formatDate(book.started_at) : "—" },
    { label: "Finished", value: book.completed_at ? formatDate(book.completed_at) : "—" },
  ];

  if (book.started_at && book.completed_at) {
    const days = daysBetween(book.started_at, book.completed_at);
    stats.push({ label: "Read in", value: `${days} day${days === 1 ? "" : "s"}` });
  }
  if (info?.year) {
    stats.push({ label: "First published", value: String(info.year) });
  }
  if (info?.reader_rating) {
    stats.push({
      label: "Apple Books readers",
      value: `${info.reader_rating.toFixed(1)}★ (${info.reader_rating_count.toLocaleString()})`,
    });
  }

  const statusClass = `status-${book.status.toLowerCase().replace(" ", "-")}`;

  return (
    <Modal labelledBy="book-detail-title" onClose={onClose} className="closeup">
      <div className="closeup-media">
        <CoverImage src={book.cover} title={book.title} author={book.author} />
      </div>

      <div className="closeup-panel">
        <div className="closeup-toolbar">
          <span className={`status-dot ${statusClass}`}>{book.status}</span>

          <div className="closeup-toolbar-actions">
            <button
              type="button"
              className="closeup-icon-button"
              onClick={() => onEdit(book)}
              aria-label={`Edit ${book.title}`}
              title="Edit"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              className="closeup-icon-button closeup-icon-danger"
              onClick={() => onDelete(book)}
              aria-label={`Delete ${book.title}`}
              title="Delete"
            >
              <TrashIcon />
            </button>
            <button
              type="button"
              className="closeup-icon-button"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="closeup-body">
          <h2 id="book-detail-title">{book.title}</h2>
          <p className="closeup-author">by {book.author}</p>

          {book.rating > 0 && (
            <p className="closeup-stars" aria-hidden="true">
              {"★".repeat(book.rating)}
              <span>{"★".repeat(MAX_RATING - book.rating)}</span>
            </p>
          )}

          {book.status === "Reading" && book.pages > 0 && (
            <div className="closeup-progress">
              <div>
                <span>
                  Page {book.current_page} of {book.pages}
                </span>
                <strong>{progress}%</strong>
              </div>
              <ProgressBar
                value={progress}
                label={`Reading progress for ${book.title}`}
                size="large"
              />
            </div>
          )}

          <dl className="book-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>

          <section className="closeup-section">
            <h3>About this book</h3>

            {isLoadingInfo ? (
              <div className="text-skeleton" aria-label="Loading description">
                <span />
                <span />
                <span />
              </div>
            ) : description ? (
              <>
                <p
                  className={`closeup-description ${
                    isLongDescription && !showFullDescription ? "clamped" : ""
                  }`}
                >
                  {description}
                </p>
                {isLongDescription && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setShowFullDescription((shown) => !shown)}
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </button>
                )}
              </>
            ) : (
              <p className="closeup-muted">No description found for this book.</p>
            )}

            {info && info.genres.length > 0 && (
              <div className="genre-list">
                {info.genres.map((genre) => (
                  <span key={genre} className="genre-tag">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="closeup-section">
            <h3>
              {reviews.length === 1
                ? "1 reader review"
                : `${reviews.length} reader reviews`}
            </h3>

            {isLoadingReviews ? (
              <p className="closeup-muted">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="closeup-muted">
                No reviews yet. Be the first to share what you thought.
              </p>
            ) : (
              <ul className="review-list">
                {reviews.map((review) => (
                  <li key={review.id} className="review">
                    <span className="review-avatar" aria-hidden="true">
                      {review.user_name.charAt(0).toUpperCase()}
                    </span>

                    <div className="review-content">
                      <div className="review-header">
                        <strong>
                          {review.user_name}
                          {review.is_mine && <span className="review-you"> (you)</span>}
                        </strong>
                        <time dateTime={review.created_at}>
                          {formatDate(review.created_at)}
                        </time>
                        {review.is_mine && (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => handleDeleteReview(review)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p>{review.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <form className="review-composer" onSubmit={handlePostReview}>
          {reviewError && (
            <p className="form-error" role="alert">
              {reviewError}
            </p>
          )}

          <div className="review-composer-row">
            <textarea
              rows={1}
              maxLength={2000}
              placeholder="Share your thoughts with other readers"
              aria-label="Write a review"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter posts; Shift+Enter adds a new line.
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              className="btn"
              disabled={isPosting || !draft.trim()}
            >
              {isPosting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default BookDetailModal;

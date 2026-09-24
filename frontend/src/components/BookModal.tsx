import { useState, type SubmitEvent } from "react";
import { errorMessage, searchBooks } from "../api";
import {
  BOOK_STATUSES,
  MAX_RATING,
  type Book,
  type BookInput,
  type BookStatus,
  type SearchResult,
} from "../types/book";
import Modal from "./Modal";

/** Form fields are kept as strings so inputs can be empty while editing. */
interface BookFormValues {
  title: string;
  author: string;
  status: BookStatus;
  pages: string;
  current_page: string;
  rating: string;
  cover: string;
  started_at: string;
  completed_at: string;
}

const EMPTY_FORM: BookFormValues = {
  title: "",
  author: "",
  status: "To Read",
  pages: "",
  current_page: "",
  rating: "",
  cover: "",
  started_at: "",
  completed_at: "",
};

function toFormValues(book: Book | null): BookFormValues {
  if (!book) {
    return EMPTY_FORM;
  }

  return {
    title: book.title,
    author: book.author,
    status: book.status,
    pages: book.pages ? String(book.pages) : "",
    current_page: book.current_page ? String(book.current_page) : "",
    rating: book.rating ? String(book.rating) : "",
    cover: book.cover,
    started_at: book.started_at?.slice(0, 10) ?? "",
    completed_at: book.completed_at?.slice(0, 10) ?? "",
  };
}

function toBookInput(values: BookFormValues): BookInput {
  return {
    title: values.title.trim(),
    author: values.author.trim(),
    status: values.status,
    pages: Number(values.pages) || 0,
    current_page: Number(values.current_page) || 0,
    rating: Number(values.rating) || 0,
    cover: values.cover.trim(),
    started_at: values.started_at || null,
    completed_at: values.completed_at || null,
  };
}

interface BookModalProps {
  /** The book being edited, or null when adding a new book. */
  book: Book | null;
  onSave: (book: BookInput) => Promise<void>;
  onClose: () => void;
}

function BookModal({ book, onSave, onClose }: BookModalProps) {
  const isEditing = book !== null;

  const [values, setValues] = useState(() => toFormValues(book));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(book?.title ?? "");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const updateField = <K extends keyof BookFormValues>(
    field: K,
    value: BookFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchMessage(null);

    try {
      const results = await searchBooks(query);
      setSearchResults(results);

      if (results.length === 0) {
        setSearchMessage("No matching books found.");
      }
    } catch (error) {
      setSearchResults([]);
      setSearchMessage(errorMessage(error));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    // Only overwrite the details search provides, so picking a result
    // while editing keeps the book's status, rating, progress and dates.
    setValues((current) => ({
      ...current,
      title: result.title,
      author: result.author,
      pages: result.pages ? String(result.pages) : current.pages,
      cover: result.cover || current.cover,
    }));

    setSearchResults([]);
    setSearchQuery(result.title);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(toBookInput(values));
    } catch (error) {
      setSaveError(errorMessage(error));
      setIsSaving(false);
    }
  };

  return (
    <Modal labelledBy="book-modal-title" onClose={onClose}>
      <h2 id="book-modal-title">
        {isEditing ? "Edit Book" : "Add New Book"}
      </h2>

      <form className="search-section" role="search" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search for a book by title or author"
          aria-label="Search for a book by title or author"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          autoFocus
        />

        <button type="submit" className="btn" disabled={isSearching}>
          {isSearching ? "Searching…" : "Search"}
        </button>
      </form>

      {searchMessage && <p className="search-message">{searchMessage}</p>}

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result, index) => (
            <button
              type="button"
              className="search-result-option"
              key={`${result.title}-${result.author}-${index}`}
              onClick={() => handleSelectResult(result)}
            >
              {result.cover ? (
                <img src={result.cover} alt="" loading="lazy" />
              ) : (
                <span className="search-result-no-cover" aria-hidden="true" />
              )}

              <span className="search-result-text">
                <strong>{result.title}</strong>
                <span>
                  {result.author || "Unknown author"}
                  {result.year && ` · ${result.year}`}
                  {result.pages > 0 && ` · ${result.pages} pages`}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <form className="book-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Title</span>
          <input
            type="text"
            required
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Author</span>
          <input
            type="text"
            required
            value={values.author}
            onChange={(event) => updateField("author", event.target.value)}
          />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Pages</span>
            <input
              type="number"
              min="0"
              value={values.pages}
              onChange={(event) => updateField("pages", event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Rating (0–{MAX_RATING})</span>
            <input
              type="number"
              min="0"
              max={MAX_RATING}
              value={values.rating}
              onChange={(event) => updateField("rating", event.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label className="form-field">
            <span>Status</span>
            <select
              value={values.status}
              onChange={(event) =>
                updateField("status", event.target.value as BookStatus)
              }
            >
              {BOOK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          {values.status === "Reading" && (
            <label className="form-field">
              <span>Current page</span>
              <input
                type="number"
                min="0"
                max={values.pages || undefined}
                value={values.current_page}
                onChange={(event) =>
                  updateField("current_page", event.target.value)
                }
              />
            </label>
          )}
        </div>

        <div className="form-row">
          <label className="form-field">
            <span>Started</span>
            <input
              type="date"
              value={values.started_at}
              onChange={(event) =>
                updateField("started_at", event.target.value)
              }
            />
          </label>

          <label className="form-field">
            <span>Completed</span>
            <input
              type="date"
              min={values.started_at || undefined}
              value={values.completed_at}
              onChange={(event) =>
                updateField("completed_at", event.target.value)
              }
            />
          </label>
        </div>

        <label className="form-field">
          <span>Cover image URL</span>
          <input
            type="text"
            placeholder="Filled in automatically from search"
            value={values.cover}
            onChange={(event) => updateField("cover", event.target.value)}
          />
        </label>

        {values.cover && (
          <div className="cover-preview">
            <img src={values.cover} alt={`Cover of ${values.title}`} />
          </div>
        )}

        {saveError && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}

        <div className="modal-actions">
          <button type="submit" className="btn" disabled={isSaving}>
            {isSaving ? "Saving…" : isEditing ? "Save Changes" : "Add Book"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default BookModal;

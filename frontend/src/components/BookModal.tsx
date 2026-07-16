import type { Dispatch, SetStateAction } from "react";
import type { SearchResult } from "../types/book";

interface NewBookForm {
  title: string;
  author: string;
  status: string;
  pages: string;
  current_page: string;
  rating: string;
  cover: string;
  started_at: string;
  completed_at: string;
}

interface BookModalProps {
  editingBookId: number | null;
  newBook: NewBookForm;
  setNewBook: Dispatch<SetStateAction<NewBookForm>>;

  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;

  searchResults: SearchResult[];
  setSearchResults: Dispatch<SetStateAction<SearchResult[]>>;

  onSearch: () => void;
  onAdd: () => void;
  onUpdate: () => void;
  onClose: () => void;
}

function BookModal({
  editingBookId,
  newBook,
  setNewBook,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  onSearch,
  onAdd,
  onUpdate,
  onClose,
}: BookModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>
          {editingBookId !== null ? "Edit Book" : "Add New Book"}
        </h2>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search book title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button onClick={onSearch}>Search</button>
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
                    current_page: "",
                    rating: "",
                    cover: result.cover_i
                      ? `https://covers.openlibrary.org/b/id/${result.cover_i}-M.jpg`
                      : "",
                    started_at: "",
                    completed_at: "",
                  });

                  setSearchResults([]);
                  setSearchQuery(result.title);
                }}
              >
                <strong>{result.title}</strong>
                <span>
                  {result.author_name?.[0] || "Unknown author"}
                </span>
              </button>
            ))}
          </div>
        )}

        {newBook.status === "Reading" && (
          <label className="date-field">
            <span>Current Page</span>

            <input
              type="number"
              placeholder="Current page"
              min="0"
              max={newBook.pages || undefined}
              value={newBook.current_page}
              onChange={(e) =>
                setNewBook({
                  ...newBook,
                  current_page: e.target.value,
                })
              }
            />
          </label>
        )}

        <input
          type="text"
          placeholder="Title"
          value={newBook.title}
          onChange={(e) =>
            setNewBook({ ...newBook, title: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Author"
          value={newBook.author}
          onChange={(e) =>
            setNewBook({ ...newBook, author: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Pages"
          value={newBook.pages}
          onChange={(e) =>
            setNewBook({ ...newBook, pages: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Rating out of 6"
          min="0"
          max="6"
          value={newBook.rating}
          onChange={(e) =>
            setNewBook({
              ...newBook,
              rating: e.target.value,
            })
          }
        />

        <label className="date-field">
          <span>Started Date</span>
          <input
            type="date"
            value={newBook.started_at}
            onChange={(e) =>
              setNewBook({
                ...newBook,
                started_at: e.target.value,
              })
            }
          />
        </label>

        <label className="date-field">
          <span>Completed Date</span>
          <input
            type="date"
            value={newBook.completed_at}
            onChange={(e) =>
              setNewBook({
                ...newBook,
                completed_at: e.target.value,
              })
            }
          />
        </label>

        {newBook.cover && (
          <div className="cover-preview">
            <img
              src={newBook.cover}
              alt={newBook.title}
            />
          </div>
        )}

        <select
          value={newBook.status}
          onChange={(e) =>
            setNewBook({ ...newBook, status: e.target.value })
          }
        >
          <option>To Read</option>
          <option>Reading</option>
          <option>Completed</option>
        </select>

        <div className="modal-actions">
          <button
            onClick={
              editingBookId !== null ? onUpdate : onAdd
            }
          >
            {editingBookId !== null
              ? "Save Changes"
              : "Add Book"}
          </button>

          <button
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookModal;
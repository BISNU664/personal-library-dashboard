import type { Dispatch, SetStateAction } from "react";
import type { SearchResult } from "../types/book";

interface NewBookForm {
  title: string;
  author: string;
  status: string;
  pages: string;
  rating: string;
  cover: string;
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
                    rating: "",
                    cover: result.cover_i
                      ? `https://covers.openlibrary.org/b/id/${result.cover_i}-M.jpg`
                      : "",
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
            setNewBook({ ...newBook, rating: e.target.value })
          }
        />

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
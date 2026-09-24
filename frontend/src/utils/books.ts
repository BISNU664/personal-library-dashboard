import type { Book, BookStatus } from "../types/book";

export type StatusFilter = BookStatus | "All";

export type SortOption = "Title" | "Author" | "Rating";

export interface LibraryFilters {
  search: string;
  status: StatusFilter;
  sort: SortOption;
}

export function filterAndSortBooks(
  books: Book[],
  filters: LibraryFilters
): Book[] {
  const query = filters.search.trim().toLowerCase();

  return books
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);

      const matchesStatus =
        filters.status === "All" || book.status === filters.status;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "Author":
          return a.author.localeCompare(b.author);
        case "Rating":
          return b.rating - a.rating;
        default:
          return a.title.localeCompare(b.title);
      }
    });
}

export function countByStatus(books: Book[], status: BookStatus): number {
  return books.filter((book) => book.status === status).length;
}

/**
 * The year a book counts towards for reading goals and analytics: the year
 * it was completed, otherwise the year it was started. Books without dates
 * count towards the current year so they are not hidden.
 */
export function getBookYear(book: Book): number {
  const date = book.completed_at ?? book.started_at;

  return date ? new Date(date).getFullYear() : new Date().getFullYear();
}

/** A whole-number percentage, capped at 100. */
export function percentage(value: number, total: number): number {
  return total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;
}

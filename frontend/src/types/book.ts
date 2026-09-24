export const BOOK_STATUSES = ["To Read", "Reading", "Completed"] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];

export const MAX_RATING = 6;

export interface Book {
  id: number;
  title: string;
  author: string;
  status: BookStatus;
  pages: number;
  rating: number;
  cover: string;
  started_at: string | null;
  completed_at: string | null;
  current_page: number;
}

/** The fields sent to the API when creating or updating a book. */
export type BookInput = Omit<Book, "id">;

/** A search hit from the backend's /books/search (Apple Books + Open Library). */
export interface SearchResult {
  title: string;
  author: string;
  cover: string;
  pages: number;
  year: number | null;
}

/** A book suggested by the AI recommender. */
export interface Recommendation {
  id: number;
  title: string;
  author: string;
  genre: string;
  reason: string;
  cover: string;
  pages: number;
}

/** Which recommender the backend uses: Claude (API key set) or the free one. */
export type RecommendationEngine = "claude" | "free";

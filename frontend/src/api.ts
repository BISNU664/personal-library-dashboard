import type {
  Book,
  BookInfo,
  BookInput,
  Recommendation,
  RecommendationEngine,
  Review,
  SearchResult,
} from "./types/book";

// Same-origin path; the Vite dev server forwards it to the backend.
const API_URL = "/api";

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();

    if (typeof body.detail === "string") {
      return body.detail;
    }

    // FastAPI validation errors arrive as a list of { loc, msg, type }.
    if (Array.isArray(body.detail)) {
      return (body.detail as ValidationError[])
        .map((error) =>
          error.type === "value_error"
            ? error.msg.replace(/^Value error, /, "")
            : `${error.loc.at(-1)}: ${error.msg}`
        )
        .join(". ");
    }
  } catch {
    // Body was not JSON; fall through to the generic message.
  }

  return `Request failed (${response.status})`;
}

let onUnauthorized = () => {};

/** Called when the session has ended (e.g. expired), so the app can show the login page. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    // The login cookie is sent automatically because the API is same-origin.
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  if (!response.ok) {
    // A 401 from anywhere but the login form means the session is over.
    if (response.status === 401 && !path.startsWith("/auth/")) {
      onUnauthorized();
    }
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

// ---------- Accounts ----------

export interface User {
  id: number;
  email: string;
  display_name: string;
  is_guest: boolean;
}

/** The logged-in reader, or null if nobody is logged in. */
export async function fetchCurrentUser(): Promise<User | null> {
  const response = await fetch(`${API_URL}/me`).catch(() => null);

  if (response?.status === 401) return null;
  if (!response?.ok) {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  return response.json();
}

export const signUp = (details: { display_name: string; email: string; password: string }) =>
  request<User>("/auth/signup", { method: "POST", body: JSON.stringify(details) });

export const logIn = (credentials: { email: string; password: string }) =>
  request<User>("/auth/login", { method: "POST", body: JSON.stringify(credentials) });

export const continueAsGuest = () =>
  request<User>("/auth/guest", { method: "POST" });

/** Turns the current guest into a full account, keeping their library. */
export const upgradeGuest = (details: { display_name: string; email: string; password: string }) =>
  request<User>("/auth/upgrade", { method: "POST", body: JSON.stringify(details) });

export const logOut = () =>
  request<{ message: string }>("/auth/logout", { method: "POST" });

export const logOutEverywhere = () =>
  request<{ message: string }>("/auth/logout-all", { method: "POST" });

// ---------- Books ----------

export const fetchBooks = () => request<Book[]>("/books");

export const createBook = (book: BookInput) =>
  request<Book>("/books", { method: "POST", body: JSON.stringify(book) });

export const updateBook = (id: number, book: BookInput) =>
  request<Book>(`/books/${id}`, { method: "PUT", body: JSON.stringify(book) });

export const deleteBook = (id: number) =>
  request<{ message: string }>(`/books/${id}`, { method: "DELETE" });

export const fetchBookInfo = (bookId: number) =>
  request<BookInfo>(`/books/${bookId}/details`);

export const fetchReviews = (bookId: number) =>
  request<Review[]>(`/books/${bookId}/reviews`);

export const createReview = (bookId: number, body: string) =>
  request<Review>(`/books/${bookId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

export const deleteReview = (reviewId: number) =>
  request<{ message: string }>(`/reviews/${reviewId}`, { method: "DELETE" });

export const fetchRecommendations = () =>
  request<Recommendation[]>("/recommendations");

export const fetchRecommendationEngine = () =>
  request<{ engine: RecommendationEngine }>("/recommendations/engine");

/** Generates a fresh batch; with Claude this can take up to a minute. */
export const refreshRecommendations = () =>
  request<Recommendation[]>("/recommendations/refresh", { method: "POST" });

export const dismissRecommendation = (id: number) =>
  request<{ message: string }>(`/recommendations/${id}/dismiss`, {
    method: "POST",
  });

export const addRecommendationToLibrary = (id: number) =>
  request<Book>(`/recommendations/${id}/add`, { method: "POST" });

export const searchBooks = (query: string) =>
  request<SearchResult[]>(`/books/search?${new URLSearchParams({ q: query })}`);

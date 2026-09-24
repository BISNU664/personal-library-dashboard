import type {
  Book,
  BookInput,
  Recommendation,
  RecommendationEngine,
  SearchResult,
} from "./types/book";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export const fetchBooks = () => request<Book[]>("/books");

export const createBook = (book: BookInput) =>
  request<Book>("/books", { method: "POST", body: JSON.stringify(book) });

export const updateBook = (id: number, book: BookInput) =>
  request<Book>(`/books/${id}`, { method: "PUT", body: JSON.stringify(book) });

export const deleteBook = (id: number) =>
  request<{ message: string }>(`/books/${id}`, { method: "DELETE" });

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

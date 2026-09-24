import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import {
  type User,
  addRecommendationToLibrary,
  createBook,
  deleteBook,
  dismissRecommendation,
  errorMessage,
  fetchBooks,
  fetchRecommendationEngine,
  fetchRecommendations,
  refreshRecommendations,
  updateBook,
} from "./api";
import type {
  Book,
  BookInput,
  Recommendation,
  RecommendationEngine,
} from "./types/book";
import { useReadingGoals } from "./hooks/useReadingGoals";
import type { Theme } from "./hooks/useTheme";
import BookDetailModal from "./components/BookDetailModal";
import BookModal from "./components/BookModal";
import RecommendationModal from "./components/RecommendationModal";
import Sidebar, { type Page } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import Library from "./pages/Library";

// Analytics pulls in the charting library, so only load it when it's opened.
const Analytics = lazy(() => import("./pages/Analytics"));

const SEARCH_PLACEHOLDERS: Record<Page, string> = {
  Home: "Search your picks by title, author or genre",
  Library: "Search your library by title or author",
  Analytics: "Search",
};

const NOTICE_DURATION_MS = 3000;

interface AppProps {
  user: User;
  theme: Theme;
  onToggleTheme: () => void;
  onLogOut: () => void;
  onLogOutEverywhere: () => void;
  onUserUpdated: (user: User) => void;
}

function App({
  user,
  theme,
  onToggleTheme,
  onLogOut,
  onLogOutEverywhere,
  onUserUpdated,
}: AppProps) {
  const [activePage, setActivePage] = useState<Page>("Home");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [engine, setEngine] = useState<RecommendationEngine>("free");
  const [openRecommendation, setOpenRecommendation] = useState<Recommendation | null>(null);

  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const { goals, getGoal, setGoal } = useReadingGoals(String(user.id));

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoadingBooks(false));

    fetchRecommendations()
      .then(setRecommendations)
      .catch((err) => setRecommendationError(errorMessage(err)))
      .finally(() => setIsLoadingRecommendations(false));

    fetchRecommendationEngine()
      .then(({ engine }) => setEngine(engine))
      .catch(() => {
        // Not critical: the default "free" wording is shown instead.
      });
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeout = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [notice]);

  const handleNavigate = (page: Page) => {
    setActivePage(page);
    setSearch("");
  };

  // ---------- Books ----------

  const openAddModal = () => {
    setEditingBook(null);
    setIsBookModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setOpenBook(null);
    setEditingBook(book);
    setIsBookModalOpen(true);
  };

  const closeBookModal = () => {
    setIsBookModalOpen(false);
    setEditingBook(null);
  };

  // Errors are left to propagate so the modal can show them next to the form.
  const handleSaveBook = async (input: BookInput) => {
    if (editingBook) {
      const saved = await updateBook(editingBook.id, input);
      setBooks((current) =>
        current.map((book) => (book.id === saved.id ? saved : book))
      );
    } else {
      const created = await createBook(input);
      setBooks((current) => [...current, created]);
    }

    closeBookModal();
  };

  const handleDeleteBook = async (book: Book) => {
    if (!window.confirm(`Delete "${book.title}" from your library?`)) return;

    try {
      await deleteBook(book.id);
      setBooks((current) => current.filter((b) => b.id !== book.id));
      setOpenBook((current) => (current?.id === book.id ? null : current));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // ---------- Recommendations ----------

  const removeRecommendation = (id: number) => {
    setRecommendations((current) => current.filter((r) => r.id !== id));
    setOpenRecommendation((current) => (current?.id === id ? null : current));
  };

  const handleRefreshRecommendations = async () => {
    setIsGenerating(true);
    setRecommendationError(null);

    try {
      setRecommendations(await refreshRecommendations());
    } catch (err) {
      setRecommendationError(errorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecommendation = async (recommendation: Recommendation) => {
    try {
      const book = await addRecommendationToLibrary(recommendation.id);
      setBooks((current) => [...current, book]);
      removeRecommendation(recommendation.id);
      setNotice(`Saved "${book.title}" to your library`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleDismissRecommendation = async (recommendation: Recommendation) => {
    // Hide it straight away; put it back if the server call fails.
    const previous = recommendations;
    removeRecommendation(recommendation.id);

    try {
      await dismissRecommendation(recommendation.id);
    } catch (err) {
      setRecommendations(previous);
      setError(errorMessage(err));
    }
  };

  // ---------- Rendering ----------

  const renderPage = () => {
    switch (activePage) {
      case "Home":
        return (
          <Home
            recommendations={recommendations}
            engine={engine}
            search={search}
            hasBooks={books.length > 0}
            isLoading={isLoadingRecommendations}
            isGenerating={isGenerating}
            error={recommendationError}
            onRefresh={handleRefreshRecommendations}
            onOpen={setOpenRecommendation}
            onSave={handleSaveRecommendation}
            onDismiss={handleDismissRecommendation}
          />
        );
      case "Library":
        return (
          <Library
            books={books}
            search={search}
            isLoading={isLoadingBooks}
            readingGoal={getGoal(new Date().getFullYear())}
            onAddBook={openAddModal}
            onOpenBook={setOpenBook}
            onEditBook={openEditModal}
            onDeleteBook={handleDeleteBook}
          />
        );
      case "Analytics":
        return (
          <Suspense fallback={<p className="feed-status">Loading analytics…</p>}>
            <Analytics
              books={books}
              readingGoals={goals}
              getGoal={getGoal}
              setGoal={setGoal}
            />
          </Suspense>
        );
    }
  };

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onAddBook={openAddModal}
        theme={theme}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogOut={onLogOut}
        onLogOutEverywhere={onLogOutEverywhere}
        onUserUpdated={(updated) => {
          onUserUpdated(updated);
          setNotice("Account created. Your library is saved.");
        }}
      />

      <div className="app-main">
        {activePage !== "Analytics" && (
          <TopBar
            search={search}
            onSearchChange={setSearch}
            placeholder={SEARCH_PLACEHOLDERS[activePage]}
          />
        )}

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {renderPage()}
      </div>

      {openRecommendation && (
        <RecommendationModal
          recommendation={openRecommendation}
          onSave={handleSaveRecommendation}
          onDismiss={handleDismissRecommendation}
          onClose={() => setOpenRecommendation(null)}
        />
      )}

      {openBook && (
        <BookDetailModal
          book={openBook}
          onEdit={openEditModal}
          onDelete={handleDeleteBook}
          onClose={() => setOpenBook(null)}
        />
      )}

      {isBookModalOpen && (
        <BookModal
          book={editingBook}
          onSave={handleSaveBook}
          onClose={closeBookModal}
        />
      )}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}

export default App;

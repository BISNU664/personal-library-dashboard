import { useMemo, useState } from "react";
import type { Recommendation, RecommendationEngine } from "../types/book";
import ChipBar from "../components/ChipBar";
import { SparkleIcon } from "../components/Icons";
import RecommendationPin from "../components/RecommendationPin";

const ALL_GENRES = "All";

const ENGINE_TEXT: Record<
  RecommendationEngine,
  { subtitle: string; loading: string; pitch: string }
> = {
  claude: {
    subtitle: "Book recommendations from Claude, based on what you read and how you rate it.",
    loading: "Claude is picking books for you. This can take up to a minute…",
    pitch: "Claude will look at your library and ratings and suggest books you're likely to love.",
  },
  free: {
    subtitle: "Free picks based on the subjects and authors of the books you rate highly.",
    loading: "Finding books you might like…",
    pitch: "We'll look at the subjects and authors of the books you rate highly and find similar reader favourites.",
  },
};

// Placeholder heights for the loading skeleton, varied like real covers.
const SKELETON_HEIGHTS = [320, 260, 380, 300, 350, 280, 400, 310, 270, 360, 330, 290];

interface HomeProps {
  recommendations: Recommendation[];
  engine: RecommendationEngine;
  search: string;
  hasBooks: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpen: (recommendation: Recommendation) => void;
  onSave: (recommendation: Recommendation) => Promise<void>;
  onDismiss: (recommendation: Recommendation) => void;
}

function Home({
  recommendations,
  engine,
  search,
  hasBooks,
  isLoading,
  isGenerating,
  error,
  onRefresh,
  onOpen,
  onSave,
  onDismiss,
}: HomeProps) {
  const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES);

  // Most common genres first, so the chip bar leads with the biggest groups.
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    recommendations.forEach(({ genre }) =>
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    );

    const sorted = [...counts.keys()].sort(
      (a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b)
    );

    return [ALL_GENRES, ...sorted];
  }, [recommendations]);

  // Fall back to "All" if the selected genre disappears after a refresh.
  const activeGenre = genres.includes(selectedGenre) ? selectedGenre : ALL_GENRES;
  const query = search.trim().toLowerCase();

  const visibleRecommendations = recommendations.filter(
    (recommendation) =>
      (activeGenre === ALL_GENRES || recommendation.genre === activeGenre) &&
      [recommendation.title, recommendation.author, recommendation.genre].some(
        (field) => field.toLowerCase().includes(query)
      )
  );

  const renderFeed = () => {
    if (isLoading || isGenerating) {
      return (
        <>
          {isGenerating && (
            <p className="feed-status">
              {ENGINE_TEXT[engine].loading}
            </p>
          )}

          <div className="masonry" aria-hidden="true">
            {SKELETON_HEIGHTS.map((height, index) => (
              <div key={index} className="pin-skeleton" style={{ height }} />
            ))}
          </div>
        </>
      );
    }

    if (recommendations.length === 0) {
      return (
        <div className="feed-empty">
          <SparkleIcon className="feed-empty-icon" />
          <h3>Discover your next favourite book</h3>
          <p>
            {hasBooks
              ? ENGINE_TEXT[engine].pitch
              : "Add a few books you've read to your library first, and the picks will match your taste."}
          </p>
          <button type="button" className="btn" onClick={onRefresh}>
            Get recommendations
          </button>
        </div>
      );
    }

    if (visibleRecommendations.length === 0) {
      return <p className="empty-state">No picks match your search.</p>;
    }

    return (
      <div className="masonry">
        {visibleRecommendations.map((recommendation) => (
          <RecommendationPin
            key={recommendation.id}
            recommendation={recommendation}
            onOpen={onOpen}
            onSave={onSave}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h2>Picked for you</h2>
          <p className="page-subtitle">{ENGINE_TEXT[engine].subtitle}</p>
        </div>

        {recommendations.length > 0 && (
          <button
            type="button"
            className="btn btn-with-icon"
            onClick={onRefresh}
            disabled={isGenerating}
          >
            <SparkleIcon />
            {isGenerating ? "Finding books…" : "New picks"}
          </button>
        )}
      </div>

      {recommendations.length > 0 && !isGenerating && (
        <ChipBar
          options={genres}
          active={activeGenre}
          onSelect={setSelectedGenre}
          label="Filter by genre"
        />
      )}

      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      {renderFeed()}
    </main>
  );
}

export default Home;

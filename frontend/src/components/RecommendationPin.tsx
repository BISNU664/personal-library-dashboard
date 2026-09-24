import { useState } from "react";
import type { Recommendation } from "../types/book";
import CoverImage from "./CoverImage";
import { CloseIcon } from "./Icons";

interface RecommendationPinProps {
  recommendation: Recommendation;
  onOpen: (recommendation: Recommendation) => void;
  onSave: (recommendation: Recommendation) => Promise<void>;
  onDismiss: (recommendation: Recommendation) => void;
}

function RecommendationPin({
  recommendation,
  onOpen,
  onSave,
  onDismiss,
}: RecommendationPinProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(recommendation);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="pin">
      <div className="pin-media">
        <button
          type="button"
          className="pin-open"
          onClick={() => onOpen(recommendation)}
          aria-label={`Why read ${recommendation.title}?`}
        >
          <CoverImage
            src={recommendation.cover}
            title={recommendation.title}
            author={recommendation.author}
          />
        </button>

        <div className="pin-overlay">
          <div className="pin-overlay-top">
            <button
              type="button"
              className="pin-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>

          <div className="pin-overlay-bottom">
            <span className="pin-genre">{recommendation.genre}</span>
            <button
              type="button"
              className="pin-icon-button"
              onClick={() => onDismiss(recommendation)}
              aria-label={`Not interested in ${recommendation.title}`}
              title="Not interested"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="pin-info">
        <h3>{recommendation.title}</h3>
        <p>{recommendation.author}</p>
      </div>
    </article>
  );
}

export default RecommendationPin;

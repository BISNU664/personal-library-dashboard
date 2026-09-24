import { useState } from "react";
import type { Recommendation } from "../types/book";
import CoverImage from "./CoverImage";
import { CloseIcon } from "./Icons";
import Modal from "./Modal";

interface RecommendationModalProps {
  recommendation: Recommendation;
  onSave: (recommendation: Recommendation) => Promise<void>;
  onDismiss: (recommendation: Recommendation) => void;
  onClose: () => void;
}

function RecommendationModal({
  recommendation,
  onSave,
  onDismiss,
  onClose,
}: RecommendationModalProps) {
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
    <Modal
      labelledBy="recommendation-title"
      onClose={onClose}
      className="recommendation-modal"
    >
      <button
        type="button"
        className="modal-close"
        onClick={onClose}
        aria-label="Close"
      >
        <CloseIcon />
      </button>

      <div className="recommendation-cover">
        <CoverImage
          src={recommendation.cover}
          title={recommendation.title}
          author={recommendation.author}
        />
      </div>

      <div className="recommendation-details">
        <span className="genre-tag">{recommendation.genre}</span>

        <h2 id="recommendation-title">{recommendation.title}</h2>
        <p className="recommendation-author">by {recommendation.author}</p>

        {recommendation.pages > 0 && (
          <p className="recommendation-pages">{recommendation.pages} pages</p>
        )}

        <h3>Why you might like it</h3>
        <p className="recommendation-reason">{recommendation.reason}</p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save to library"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onDismiss(recommendation)}
          >
            Not interested
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RecommendationModal;

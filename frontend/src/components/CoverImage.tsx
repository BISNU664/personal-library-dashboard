import { useState } from "react";

// Background tones are defined per theme in index.css (--tone-0 … --tone-6).
const TONE_COUNT = 7;

// Varied shapes keep the masonry feed from looking like a uniform grid.
const PLACEHOLDER_RATIOS = ["2 / 3", "3 / 4", "4 / 5", "5 / 7"];

function hashText(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash);
}

interface CoverImageProps {
  src: string;
  title: string;
  author?: string;
}

/** A book cover, or a coloured placeholder when there is no usable image. */
function CoverImage({ src, title, author }: CoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && src !== failedSrc) {
    return (
      <img
        className="cover"
        src={src}
        alt={`Cover of ${title}`}
        loading="lazy"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  const hash = hashText(title);

  return (
    <div
      className={`cover cover-placeholder cover-tone-${hash % TONE_COUNT}`}
      role="img"
      aria-label={`${title} (no cover available)`}
      style={{ aspectRatio: PLACEHOLDER_RATIOS[hash % PLACEHOLDER_RATIOS.length] }}
    >
      <span className="cover-placeholder-title">{title}</span>
      {author && <span className="cover-placeholder-author">{author}</span>}
    </div>
  );
}

export default CoverImage;

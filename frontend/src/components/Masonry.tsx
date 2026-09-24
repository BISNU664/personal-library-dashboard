import {
  Children,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Keep in sync with .masonry / .masonry-column in App.css.
const MIN_COLUMN_WIDTH = 236;
const MIN_COLUMN_WIDTH_NARROW = 150;
const NARROW_BREAKPOINT = 640;
const GAP = 16;

function columnCountFor(width: number): number {
  const minWidth =
    window.innerWidth <= NARROW_BREAKPOINT ? MIN_COLUMN_WIDTH_NARROW : MIN_COLUMN_WIDTH;
  return Math.max(1, Math.floor((width + GAP) / (minWidth + GAP)));
}

interface MasonryProps {
  children: ReactNode;
  className?: string;
}

/**
 * Pinterest-style staggered grid that reads left to right: items are dealt
 * into columns in turn, so the first row is items 1, 2, 3… and so on.
 * (CSS `columns` would fill each column top to bottom instead.)
 */
function Masonry({ children, className = "" }: MasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(() =>
    columnCountFor(window.innerWidth)
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => setColumnCount(columnCountFor(container.clientWidth));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const columns: ReactNode[][] = Array.from({ length: columnCount }, () => []);
  Children.toArray(children).forEach((child, index) => {
    columns[index % columnCount].push(child);
  });

  return (
    <div ref={containerRef} className={`masonry ${className}`}>
      {columns.map((items, index) => (
        <div key={index} className="masonry-column">
          {items}
        </div>
      ))}
    </div>
  );
}

export default Masonry;

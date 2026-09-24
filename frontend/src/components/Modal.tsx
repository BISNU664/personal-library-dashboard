import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  /** id of the element that names the dialog, usually its heading. */
  labelledBy: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Overlay + dialog shell that closes on Escape or a click outside. Rendered
 * into <body> so it always sits above the page, wherever it is used.
 */
function Modal({ labelledBy, onClose, className = "", children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;

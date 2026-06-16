import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PopupProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  panelClassName?: string;
};

export default function Popup({ open, onClose, title, children, panelClassName = '' }: PopupProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="popup-backdrop" onClick={onClose} role="presentation">
      <div
        className={`popup-panel${panelClassName ? ` ${panelClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="popup-header">
          <h2 id="popup-title" className="popup-title">{title}</h2>
          <button type="button" className="popup-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="popup-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PopupProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  panelClassName?: string;
};

/** Open popups, oldest first. Only the top one handles Escape. */
const popupStack: symbol[] = [];
let bodyLockCount = 0;
let savedBodyOverflow = '';

export default function Popup({ open, onClose, title, children, panelClassName = '' }: PopupProps) {
  const titleId = useId();
  const tokenRef = useRef(Symbol('popup'));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const token = tokenRef.current;
    popupStack.push(token);
    if (bodyLockCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    bodyLockCount += 1;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (popupStack[popupStack.length - 1] !== token) return;
      e.preventDefault();
      e.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      const index = popupStack.lastIndexOf(token);
      if (index !== -1) popupStack.splice(index, 1);
      bodyLockCount -= 1;
      if (bodyLockCount <= 0) {
        bodyLockCount = 0;
        document.body.style.overflow = savedBodyOverflow;
      }
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="popup-backdrop" onClick={onClose} role="presentation">
      <div
        className={`popup-panel${panelClassName ? ` ${panelClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="popup-header">
          <h2 id={titleId} className="popup-title">{title}</h2>
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

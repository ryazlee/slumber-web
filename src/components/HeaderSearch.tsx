import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SearchPopoverContent from './SearchPopoverContent';

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="header-search" ref={rootRef}>
      <button
        type="button"
        className={`header-search-trigger${open ? ' header-search-trigger--open' : ''}`}
        aria-label="Search"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <SearchIcon />
      </button>

      {open && createPortal(
        <>
          <div className="header-search-backdrop" aria-hidden="true" />
          <div
            ref={panelRef}
            id={panelId}
            className="header-search-panel"
            role="dialog"
            aria-label="Search"
          >
            <SearchPopoverContent onClose={close} />
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

import type { ReactNode } from 'react';
import Popup from '../Popup';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
};

/** Centered admin action form. Reuses the site Popup (overlay, Escape, backdrop). */
export default function AdminFormDialog({ open, onClose, title, children, wide = false }: Props) {
  return (
    <Popup
      open={open}
      onClose={onClose}
      title={title}
      panelClassName={wide ? 'popup-panel--admin popup-panel--admin-wide' : 'popup-panel--admin'}
    >
      {children}
    </Popup>
  );
}

import { useCallback, useState } from 'react';
import { useEscapeKey } from './useEscapeKey';

/** Shared draft / edit-panel state for admin catalog screens (tags, roles, …). */
export function useAdminCatalogForm<TDraft>(emptyDraft: TDraft) {
  const [draft, setDraft] = useState<TDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const showForm = formOpen || editingId !== null;

  const closeForm = useCallback(() => {
    setDraft(emptyDraft);
    setEditingId(null);
    setFormOpen(false);
    setFormError(null);
  }, [emptyDraft]);

  useEscapeKey(showForm, closeForm);

  const openCreate = useCallback(() => {
    setDraft(emptyDraft);
    setEditingId(null);
    setFormOpen(true);
    setFormError(null);
  }, [emptyDraft]);

  return {
    draft,
    setDraft,
    editingId,
    setEditingId,
    formOpen,
    setFormOpen,
    formError,
    setFormError,
    showForm,
    closeForm,
    openCreate,
  };
}

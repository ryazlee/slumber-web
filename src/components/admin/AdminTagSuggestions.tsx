import type { TagSuggestionRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminTagSuggestions, useDenyAdminTagSuggestion } from '../../hooks/useAdmin';

type Props = {
  onApprove: (suggestion: TagSuggestionRow) => void;
};

function postCountLabel(count: number): string {
  return `${count} post${count === 1 ? '' : 's'}`;
}

export default function AdminTagSuggestions({ onApprove }: Props) {
  const suggestionsQuery = useAdminTagSuggestions();
  const denyMutation = useDenyAdminTagSuggestion();
  const rows = suggestionsQuery.data ?? [];
  const error = getOptionalQueryErrorMessage(suggestionsQuery.error, 'Could not load tag suggestions.');

  const handleDeny = async (row: TagSuggestionRow) => {
    const who = row.submitters?.trim() || 'the submitter';
    const message = row.post_count > 0
      ? `Deny “${row.label}”? It will come off ${postCountLabel(row.post_count)} from ${who}.`
      : `Deny “${row.label}” from ${who}?`;
    if (!window.confirm(message)) return;
    try {
      await denyMutation.mutateAsync(row.id);
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Could not deny that tag.');
    }
  };

  if (!error && !suggestionsQuery.isLoading && rows.length === 0) return null;

  return (
    <div className="admin-suggestion-block">
      <h3 className="admin-suggestion-title">Waiting for review</h3>
      {error ? <p className="admin-error">{error}</p> : null}
      {suggestionsQuery.isLoading ? <p className="admin-muted">Loading suggestions…</p> : null}
      {rows.length > 0 ? (
        <div className="admin-suggestion-list">
          {rows.map((row) => (
            <div key={row.id} className="admin-suggestion-row">
              <div>
                <p className="admin-suggestion-label">{row.emoji} {row.label}</p>
                <p className="admin-muted">
                  {row.submitters?.trim() || 'Unknown'}
                  {' · '}
                  {postCountLabel(row.post_count)}
                  {' · '}
                  <code className="admin-code">{row.value}</code>
                </p>
              </div>
              <div className="admin-suggestion-actions">
                <button
                  className="admin-button admin-button-sm"
                  type="button"
                  onClick={() => onApprove(row)}
                  disabled={denyMutation.isPending}
                >
                  Approve
                </button>
                <button
                  className="admin-button admin-button-sm admin-button-danger"
                  type="button"
                  onClick={() => { void handleDeny(row); }}
                  disabled={denyMutation.isPending}
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

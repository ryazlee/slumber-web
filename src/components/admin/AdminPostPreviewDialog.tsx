import type { AdminPostRaw, RecentPostRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminPost } from '../../hooks/useAdmin';
import AdminFormDialog from './AdminFormDialog';

type Props = {
  postId: string | null;
  /** Fields already on the admin list row. Anything missing is omitted. */
  row?: Partial<RecentPostRow> | null;
  onClose: () => void;
};

function formatSleepMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatSleepDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function rawString(data: AdminPostRaw | null, key: string): string | null {
  if (!data) return null;
  const value = data[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function rawBoolean(data: AdminPostRaw | null, key: string): boolean | null {
  if (!data) return null;
  const value = data[key];
  return typeof value === 'boolean' ? value : null;
}

function sourceLabel(isCustom: boolean | null, device: string | null): string | null {
  if (isCustom == null && !device) return null;
  if (isCustom) return 'Manual';
  return device?.trim() || 'Wearable';
}

export default function AdminPostPreviewDialog({ postId, row = null, onClose }: Props) {
  const query = useAdminPost(postId);
  const raw = query.data ?? null;
  const error = getOptionalQueryErrorMessage(query.error, 'Could not load post.');

  const username = row?.username?.trim() || null;
  const title = row?.title?.trim() || rawString(raw, 'title');
  const sleepDate = row?.sleep_date?.trim() || rawString(raw, 'sleep_date');
  const bedtime = rawString(raw, 'bedtime');
  const wakeTime = rawString(raw, 'wake_time');
  const asleep = asNumber(row?.asleep_minutes) ?? asNumber(raw?.asleep_minutes);
  const inBed = asNumber(row?.in_bed_minutes) ?? asNumber(raw?.in_bed_minutes);
  const isCustom = typeof row?.is_custom === 'boolean' ? row.is_custom : rawBoolean(raw, 'is_custom');
  const device = row?.source_device?.trim() || rawString(raw, 'source_device');
  const source = sourceLabel(isCustom, device);
  const isPrivate = rawBoolean(raw, 'is_private');
  const kudos = asNumber(row?.kudos_count);
  const comments = asNumber(row?.comments_count);
  const dreamText = rawString(raw, 'dream_log');
  const deletedAt = rawString(raw, 'deleted_at');

  const facts: { label: string; value: string }[] = [];
  if (username) facts.push({ label: 'User', value: `@${username}` });
  if (sleepDate) facts.push({ label: 'Sleep date', value: formatSleepDate(sleepDate) });
  if (title) facts.push({ label: 'Title', value: title });
  if (bedtime) facts.push({ label: 'Bedtime', value: bedtime });
  if (wakeTime) facts.push({ label: 'Wake', value: wakeTime });
  if (asleep != null) facts.push({ label: 'Duration', value: formatSleepMinutes(asleep) });
  if (inBed != null) facts.push({ label: 'In bed', value: formatSleepMinutes(inBed) });
  if (source) facts.push({ label: 'Source', value: source });
  if (isPrivate) facts.push({ label: 'Privacy', value: 'Private' });
  if (kudos != null) facts.push({ label: 'Kudos', value: kudos.toLocaleString() });
  if (comments != null) facts.push({ label: 'Comments', value: comments.toLocaleString() });

  const headingName = title || (sleepDate ? formatSleepDate(sleepDate) : 'Sleep post');
  const heading = username ? `${headingName} · @${username}` : headingName;
  const showDreamFallback = Boolean(row?.has_dream) && query.isFetched && !dreamText;
  const waiting = Boolean(postId) && query.isLoading && facts.length === 0 && !dreamText;

  return (
    <AdminFormDialog open={Boolean(postId)} onClose={onClose} title={heading}>
      {deletedAt ? <p className="admin-error">Soft-deleted {deletedAt}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {waiting ? <p className="admin-muted">Loading post…</p> : null}
      {!waiting && !error && facts.length === 0 && !dreamText && query.isFetched ? (
        <p className="admin-muted">Post not found.</p>
      ) : null}
      {facts.length > 0 ? (
        <dl className="admin-user-detail-grid">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {dreamText ? (
        <section className="admin-report-content-block">
          <h4 className="admin-report-content-label">Dream</h4>
          <blockquote className="admin-report-quote">{dreamText}</blockquote>
        </section>
      ) : null}
      {showDreamFallback ? <p className="admin-muted">Dream logged.</p> : null}
    </AdminFormDialog>
  );
}

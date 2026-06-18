import { ADMIN_GRID_CLIENT_FILTER_HINT, ADMIN_GRID_CLIENT_FILTER_HINT_INLINE } from '../../lib/adminCopy';

type Props = {
  /** When true, renders the full sentence (for footers). Default: inline fragment for summaries. */
  fullSentence?: boolean;
  suffix?: string;
};

export default function AdminGridClientFilterHint({ fullSentence, suffix }: Props) {
  const text = fullSentence ? ADMIN_GRID_CLIENT_FILTER_HINT : ADMIN_GRID_CLIENT_FILTER_HINT_INLINE;
  if (suffix) {
    return <>{text}{suffix}</>;
  }
  return <>{text}</>;
}

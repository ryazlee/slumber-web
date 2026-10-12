import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import DeepLinkLanding, { DeepLinkNotFound } from '../components/DeepLinkLanding';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function monthName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 15).toLocaleDateString('en-US', { month: 'long' });
}

export default function RecapLandingPage() {
  const { month } = useParams();
  const monthKey = month && MONTH_RE.test(month) ? month : null;
  const title = useMemo(
    () => (monthKey ? `Your ${monthName(monthKey)} recap is ready` : null),
    [monthKey],
  );

  if (!monthKey || !title) {
    return <DeepLinkNotFound />;
  }

  return (
    <DeepLinkLanding
      intent="monthly-recap"
      title={title}
      subtitle="Open Slumber to view and share last month’s sleep recap."
      schemePath={`recap/${monthKey}`}
    />
  );
}

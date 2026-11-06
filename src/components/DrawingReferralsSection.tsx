import { useEffect } from 'react';
import { useMyDrawingReferrals } from '../hooks/useChallenges';
import { seedFreshReferralProfile } from '../lib/profile';
import {
  drawingReferralCountsLine,
  drawingReferralPersonStatus,
} from '../lib/drawing';
import CollapsibleSection from './CollapsibleSection';
import UserLink from './UserLink';

type Props = {
  challengeId: string;
};

export default function DrawingReferralsSection({ challengeId }: Props) {
  const query = useMyDrawingReferrals(challengeId, true);
  const referrals = query.data ?? [];
  const qualified = referrals.filter((person) => person.qualified).length;

  useEffect(() => {
    const people = query.data;
    if (!people) return;
    for (const person of people) {
      seedFreshReferralProfile(person);
    }
  }, [query.data]);

  return (
    <CollapsibleSection
      title="Your referrals"
      count={referrals.length}
      defaultOpen={false}
    >
      <p className="app-muted">
        People who created an account from your join link. Posted sleep adds a referral entry.
      </p>
      {referrals.length > 0 ? (
        <p className="app-muted">{drawingReferralCountsLine(referrals.length, qualified)}</p>
      ) : null}
      {query.isLoading ? (
        <p className="app-muted">Loading referrals…</p>
      ) : query.isError ? (
        <p className="app-muted">Couldn’t load your referrals.</p>
      ) : referrals.length === 0 ? (
        <p className="app-muted">No one has signed up from your link yet.</p>
      ) : (
        <div className="drawing-referrals">
          {referrals.map((person) => (
            <div key={person.userId} className="drawing-referral-row">
              {person.hasProfile ? (
                <UserLink
                  userId={person.userId}
                  username={person.username}
                  avatarUrl={person.avatarUrl ?? undefined}
                  showAvatar
                  avatarSize="sm"
                  showStreak={false}
                />
              ) : (
                <span>{person.username}</span>
              )}
              <span className={person.qualified
                ? 'drawing-referral-status drawing-referral-status--ok'
                : 'drawing-referral-status'}
              >
                {drawingReferralPersonStatus(person.qualified)}
              </span>
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}

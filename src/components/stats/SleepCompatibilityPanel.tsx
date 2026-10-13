import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../Avatar';
import Popup from '../Popup';
import { useSleepCompatibilityRankings } from '../../hooks/useSleepCompatibility';
import type { SleepCompatibilityRanking } from '../../lib/sleepCompatibility';
import SleepCompatibilityPopup from './SleepCompatibilityPopup';

function friendLabel(username: string): string {
  const name = username.trim();
  return name ? `@${name.replace(/^@/, '')}` : 'this friend';
}

export default function SleepCompatibilityPanel() {
  const { rankings, loading, hasFriends, selfReady } = useSleepCompatibilityRankings(true);
  const list = Array.isArray(rankings) ? rankings : [];
  const featured = list[0] ?? null;
  const [listOpen, setListOpen] = useState(false);
  const [infoFriend, setInfoFriend] = useState<SleepCompatibilityRanking | null>(null);

  let emptyTitle = 'No match yet';
  let emptyBody = 'Add friends to see who sleeps like you.';
  if (hasFriends && !selfReady) {
    emptyTitle = 'Need a few more nights';
    emptyBody = 'Log a few wearable nights in the last 30 days to match.';
  } else if (hasFriends && selfReady && !loading) {
    emptyTitle = 'Not enough overlap';
    emptyBody = 'Friends need a few wearable nights in the last 30 days too.';
  }

  return (
    <section className="stats-section">
      <h2 className="stats-section-label">Most compatible</h2>
      <div className="stats-card compat-card">
        {loading && !featured ? (
          <p className="app-muted">Loading compatibility…</p>
        ) : featured ? (
          <>
            <div className="compat-featured">
              <Link to={`/profile/${featured.id}`} className="compat-featured-person">
                <Avatar
                  userId={featured.id}
                  username={featured.username}
                  size="sm"
                />
                <span>
                  <span className="compat-featured-name">@{featured.username}</span>
                  <span className="compat-featured-why">
                    {(featured.reasons ?? []).join(' · ') || 'Last 30 days'}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                className="compat-score-btn"
                onClick={() => setInfoFriend(featured)}
                aria-label={`Sleep compatibility ${featured.score} out of 100. Show factors.`}
              >
                {featured.score}/100
              </button>
            </div>
            {list.length > 1 ? (
              <button type="button" className="compat-see-more" onClick={() => setListOpen(true)}>
                See more
              </button>
            ) : null}
          </>
        ) : (
          <div className="compat-empty">
            <p className="compat-empty-title">{emptyTitle}</p>
            <p className="app-muted">{emptyBody}</p>
          </div>
        )}
      </div>

      <Popup open={listOpen} onClose={() => setListOpen(false)} title="Most compatible">
        <div className="compat-list">
          {list.map((friend) => (
            <div key={friend.id} className="compat-list-row">
              <Link to={`/profile/${friend.id}`} className="compat-featured-person" onClick={() => setListOpen(false)}>
                <Avatar userId={friend.id} username={friend.username} size="sm" />
                <span className="compat-featured-name">@{friend.username}</span>
              </Link>
              <button
                type="button"
                className="compat-score-btn"
                onClick={() => {
                  setListOpen(false);
                  setInfoFriend(friend);
                }}
              >
                {friend.score}/100
              </button>
            </div>
          ))}
        </div>
      </Popup>

      <SleepCompatibilityPopup
        open={infoFriend != null}
        onClose={() => setInfoFriend(null)}
        score={infoFriend}
        friendName={infoFriend ? friendLabel(infoFriend.username) : 'this friend'}
      />
    </section>
  );
}

import { useState } from 'react';
import { useFriendSleepCompatibility } from '../../hooks/useSleepCompatibility';
import SleepCompatibilityPopup from './SleepCompatibilityPopup';

type Props = {
  friendId: string;
  friendName: string;
};

export default function ProfileSleepCompatibility({ friendId, friendName }: Props) {
  const { result, loading } = useFriendSleepCompatibility(friendId, true);
  const [open, setOpen] = useState(false);
  const label = friendName.startsWith('@') ? friendName : `@${friendName}`;

  if (!loading && !result) return null;

  return (
    <div className="profile-compat">
      {loading || !result ? (
        <p className="app-muted">Sleep compatibility…</p>
      ) : (
        <button
          type="button"
          className="profile-compat-btn"
          onClick={() => setOpen(true)}
          aria-label={`Sleep compatibility ${result.score} out of 100`}
        >
          <span>Sleep Compatibility</span>
          <span className="profile-compat-score">{result.score}/100</span>
        </button>
      )}
      <SleepCompatibilityPopup
        open={open}
        onClose={() => setOpen(false)}
        score={result}
        friendName={label}
      />
    </div>
  );
}

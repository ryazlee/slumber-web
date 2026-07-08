import { Link } from 'react-router-dom';
import type { SleepBuddyProfile, SleepBuddyStatus } from '../lib/types';

type Buddy = SleepBuddyProfile & { status?: SleepBuddyStatus };

type Props = {
  buddies: Buddy[];
  variant?: 'card' | 'detail';
};

export default function SleepBuddiesRow({ buddies, variant = 'card' }: Props) {
  if (!buddies.length) return null;

  const isDetail = variant === 'detail';

  return (
    <div
      className={`post-sleep-buddies${isDetail ? ' post-sleep-buddies--detail' : ''}`}
      data-post-interactive
    >
      <p className={`post-sleep-buddies-line${isDetail ? ' post-sleep-buddies-line--detail' : ''}`}>
        <span className="post-sleep-buddies-lead">Slept with </span>
        {buddies.map((buddy, index) => {
          const pending = buddy.status === 'pending';
          return (
            <span key={buddy.userId} className="post-sleep-buddies-mention-wrap">
              {index > 0 ? <span className="post-sleep-buddies-sep"> · </span> : null}
              <Link
                to={`/profile/${buddy.userId}`}
                className={`post-sleep-buddies-mention${pending ? ' post-sleep-buddies-mention--pending' : ''}`}
              >
                @{buddy.username}
              </Link>
              {pending ? <span className="post-sleep-buddies-pending"> (pending)</span> : null}
            </span>
          );
        })}
      </p>
    </div>
  );
}

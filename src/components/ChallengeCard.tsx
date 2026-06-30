import { Link } from 'react-router-dom';
import type { Challenge } from '../lib/types';
import { formatChallengeRaceType, formatChallengeStatus, goalHours } from '../lib/format';
import ChallengeGraceCountdown from './ChallengeGraceCountdown';

type ChallengeCardProps = {
  challenge: Challenge;
};

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const accepted = challenge.participants.filter((p) => p.inviteStatus === 'accepted');
  const title = challenge.title?.trim() || formatChallengeRaceType(challenge);
  const isFinalizing = challenge.status === 'pending_completion';

  return (
    <Link to={`/challenges/${challenge.id}`} className="challenge-card challenge-card-link">
      <div className="challenge-card-top">
        <h3 className="challenge-title">{title}</h3>
        <span className={`challenge-status challenge-status--${challenge.status}`}>
          {formatChallengeStatus(challenge.status)}
        </span>
      </div>

      {isFinalizing ? (
        <p className="challenge-grace-banner">
          <ChallengeGraceCountdown
            challenge={challenge}
            prefix="Finalizing: "
            suffix=" to sync"
          />
        </p>
      ) : null}

      <p className="challenge-meta">
        {goalHours(challenge.goalMinutes)} goal
        {challenge.expiresAt && challenge.status === 'active' && (
          <> · ends {new Date(challenge.expiresAt).toLocaleDateString()}</>
        )}
      </p>

      <div className="challenge-participants">
        {accepted.map((p) => (
          <span key={p.userId} className="challenge-participant">
            @{p.username}
          </span>
        ))}
      </div>
    </Link>
  );
}

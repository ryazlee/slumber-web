import { useMemo } from 'react';
import ChallengeCard from '../../components/ChallengeCard';
import ChallengeListSkeleton from '../../components/ChallengeListSkeleton';
import CollapsibleSection from '../../components/CollapsibleSection';
import { useAuth } from '../../context/AuthContext';
import { useActiveChallenges, useChallengeProgressMap, useCompletedChallenges } from '../../hooks/useChallenges';
import { challengeHasOfficiallyStarted, splitChallengeLists } from '../../lib/challengeSections';

export default function Challenges() {
  const { user } = useAuth();
  const activeQuery = useActiveChallenges();
  const completedQuery = useCompletedChallenges();

  const loading = activeQuery.isLoading || completedQuery.isLoading;
  const error = activeQuery.error ?? completedQuery.error;
  const errorMessage = error instanceof Error ? error.message : error ? 'Could not load challenges.' : null;

  const active = activeQuery.data ?? [];
  const completed = completedQuery.data ?? [];
  const userId = user?.id ?? '';

  const lists = useMemo(
    () => splitChallengeLists(active, userId),
    [active, userId],
  );

  const progressIds = useMemo(() => {
    const ids: string[] = [];
    for (const challenge of [...lists.finalizing, ...lists.urgent, ...lists.active]) {
      if (challengeHasOfficiallyStarted(challenge)) ids.push(challenge.id);
    }
    return ids;
  }, [lists]);
  const progressById = useChallengeProgressMap(progressIds);

  const empty = !loading && !errorMessage
    && lists.invites.length === 0
    && lists.urgent.length === 0
    && lists.finalizing.length === 0
    && lists.waiting.length === 0
    && lists.active.length === 0
    && completed.length === 0;

  return (
    <div className="app-page app-page--challenges">
      <header className="app-page-header app-page-header--compact">
        <h1>Challenges</h1>
        <p className="app-muted challenges-page-note">
          Create a race or accept an invite in the app.
        </p>
      </header>

      {loading && <ChallengeListSkeleton count={3} />}
      {errorMessage && <p className="admin-error">{errorMessage}</p>}

      {empty ? (
        <p className="app-muted">No challenges yet. Start one in the app.</p>
      ) : null}

      {!loading && !errorMessage && userId ? (
        <div className="challenge-sections">
          {lists.finalizing.length > 0 ? (
            <CollapsibleSection title="Finalizing" count={lists.finalizing.length}>
              <div className="challenge-list challenge-list--board">
                {lists.finalizing.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={userId}
                    variant="race"
                    progress={progressById[challenge.id]}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          {lists.invites.length + lists.urgent.length > 0 ? (
            <CollapsibleSection title="Needs you" count={lists.invites.length + lists.urgent.length}>
              <div className="challenge-list challenge-list--board">
                {lists.invites.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={userId}
                    variant="invite"
                  />
                ))}
                {lists.urgent.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={userId}
                    variant="race"
                    progress={progressById[challenge.id]}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          {lists.waiting.length > 0 ? (
            <CollapsibleSection title="Waiting" count={lists.waiting.length}>
              <div className="challenge-list">
                {lists.waiting.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={userId}
                    variant="compact"
                  />
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          {lists.active.length > 0 ? (
            <CollapsibleSection title="Active" count={lists.active.length}>
              <div className="challenge-list challenge-list--board">
                {lists.active.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={userId}
                    variant="race"
                    progress={progressById[challenge.id]}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          {completed.length > 0 ? (
            <CollapsibleSection title="Past challenges" count={completed.length} defaultOpen={false}>
              <div className="challenge-list">
                {completed.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={userId}
                    variant="compact"
                  />
                ))}
              </div>
            </CollapsibleSection>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

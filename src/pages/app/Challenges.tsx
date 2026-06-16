import ChallengeCard from '../../components/ChallengeCard';
import { useActiveChallenges, useCompletedChallenges } from '../../hooks/useChallenges';

export default function Challenges() {
  const activeQuery = useActiveChallenges();
  const completedQuery = useCompletedChallenges();

  const loading = activeQuery.isLoading || completedQuery.isLoading;
  const error = activeQuery.error ?? completedQuery.error;
  const errorMessage = error instanceof Error ? error.message : error ? 'Could not load challenges.' : null;

  const active = activeQuery.data ?? [];
  const completed = completedQuery.data ?? [];

  return (
    <div className="app-page">
      <header className="app-page-header app-page-header--compact">
        <h1>Challenges</h1>
      </header>

      {loading && <p className="app-muted">Loading challenges…</p>}
      {errorMessage && <p className="admin-error">{errorMessage}</p>}

      {!loading && !errorMessage && (
        <>
          <section className="app-section">
            <h2>Active</h2>
            {active.length === 0 ? (
              <p className="app-muted">No active challenges.</p>
            ) : (
              <div className="challenge-list">
                {active.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
              </div>
            )}
          </section>

          <section className="app-section">
            <h2>Completed</h2>
            {completed.length === 0 ? (
              <p className="app-muted">No completed challenges yet.</p>
            ) : (
              <div className="challenge-list">
                {completed.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

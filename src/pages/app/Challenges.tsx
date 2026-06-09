import { useCallback, useEffect, useState } from 'react';
import ChallengeCard from '../../components/ChallengeCard';
import { fetchChallenges } from '../../lib/challenges';
import type { Challenge } from '../../lib/types';

export default function Challenges() {
  const [active, setActive] = useState<Challenge[]>([]);
  const [completed, setCompleted] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeRows, completedRows] = await Promise.all([
        fetchChallenges(['active', 'pending', 'pending_completion']),
        fetchChallenges(['completed']),
      ]);
      setActive(activeRows);
      setCompleted(completedRows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load challenges.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1>Challenges</h1>
        <p className="app-muted">Active races and completed history.</p>
      </header>

      {loading && <p className="app-muted">Loading challenges…</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && (
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

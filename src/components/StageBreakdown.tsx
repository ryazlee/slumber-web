import { formatMins } from '../lib/format';
import type { SleepPost } from '../lib/types';

type StageKey = 'coreMinutes' | 'deepMinutes' | 'remMinutes' | 'awakeMinutes';

const STAGES: { key: StageKey; label: string; color: string }[] = [
  { key: 'coreMinutes', label: 'Core', color: 'var(--core)' },
  { key: 'deepMinutes', label: 'Deep', color: 'var(--deep)' },
  { key: 'remMinutes', label: 'REM', color: 'var(--rem)' },
  { key: 'awakeMinutes', label: 'Awake', color: 'var(--awake)' },
];

type Props = {
  post: Pick<
    SleepPost,
    'coreMinutes' | 'deepMinutes' | 'remMinutes' | 'awakeMinutes' | 'inBedMinutes' | 'asleepMinutes'
  >;
};

export default function StageBreakdown({ post }: Props) {
  const totalMinutes = post.inBedMinutes || post.asleepMinutes;
  const rows = STAGES
    .map((stage) => ({
      ...stage,
      minutes: post[stage.key],
    }))
    .filter((stage) => stage.minutes > 0);

  if (totalMinutes <= 0 || rows.length === 0) return null;

  return (
    <div className="stage-breakdown">
      {rows.map((stage) => {
        const pct = Math.round((stage.minutes / totalMinutes) * 100);
        return (
          <div key={stage.key} className="stage-breakdown-row">
            <span
              className="stage-breakdown-dot"
              style={{ background: stage.color }}
              aria-hidden="true"
            />
            <span className="stage-breakdown-label">{stage.label}</span>
            <span className="stage-breakdown-bar" aria-hidden="true">
              <span
                className="stage-breakdown-bar-fill"
                style={{ width: `${pct}%`, background: stage.color }}
              />
            </span>
            <span className="stage-breakdown-mins">{formatMins(stage.minutes)}</span>
            <span className="stage-breakdown-pct">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

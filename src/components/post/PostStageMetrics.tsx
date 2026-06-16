import { formatMins } from '../../lib/format';
import type { SleepSessionData } from '../../lib/types';

type StageData = Pick<
  SleepSessionData,
  'coreMinutes' | 'deepMinutes' | 'remMinutes' | 'awakeMinutes' | 'awakeEvents'
>;

type Props = {
  data: StageData;
  labelStyle?: 'lower' | 'title';
  className?: string;
};

function stageLabel(label: string, mins: number, style: 'lower' | 'title') {
  const formatted = formatMins(mins);
  return style === 'title' ? `${label} ${formatted}` : `${formatted} ${label.toLowerCase()}`;
}

export default function PostStageMetrics({ data, labelStyle = 'lower', className }: Props) {
  const classes = ['post-stage-metrics', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {data.coreMinutes > 0 && (
        <span className="post-stage-metric post-stage-metric--core">
          {stageLabel('Core', data.coreMinutes, labelStyle)}
        </span>
      )}
      {data.deepMinutes > 0 && (
        <span className="post-stage-metric post-stage-metric--deep">
          {stageLabel('Deep', data.deepMinutes, labelStyle)}
        </span>
      )}
      {data.remMinutes > 0 && (
        <span className="post-stage-metric post-stage-metric--rem">
          {stageLabel('REM', data.remMinutes, labelStyle)}
        </span>
      )}
      {data.awakeMinutes > 0 && (
        <span className="post-stage-metric post-stage-metric--awake">
          {stageLabel('Awake', data.awakeMinutes, labelStyle)}
        </span>
      )}
      {data.awakeEvents > 0 && (
        <span className="post-stage-metric post-stage-metric--muted">
          {data.awakeEvents} {data.awakeEvents === 1 ? 'wake' : 'wakes'}
        </span>
      )}
    </div>
  );
}

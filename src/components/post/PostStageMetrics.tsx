import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatMins } from '../../lib/format';
import { pickStageMetricRowSize, type StageMetricSize } from '../../lib/stageMetricSizing';
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
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<StageMetricSize>('regular');

  const labels = useMemo(() => {
    const out: string[] = [];
    if (data.coreMinutes > 0) out.push(stageLabel('Core', data.coreMinutes, labelStyle));
    if (data.deepMinutes > 0) out.push(stageLabel('Deep', data.deepMinutes, labelStyle));
    if (data.remMinutes > 0) out.push(stageLabel('REM', data.remMinutes, labelStyle));
    if (data.awakeMinutes > 0) out.push(stageLabel('Awake', data.awakeMinutes, labelStyle));
    if (data.awakeEvents > 0) {
      out.push(`${data.awakeEvents} ${data.awakeEvents === 1 ? 'wake' : 'wakes'}`);
    }
    return out;
  }, [data, labelStyle]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || labels.length === 0) return;

    const measure = () => {
      setSize(pickStageMetricRowSize(labels, el.clientWidth).size);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [labels]);

  const classes = [
    'post-stage-metrics',
    `post-stage-metrics--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes}>
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

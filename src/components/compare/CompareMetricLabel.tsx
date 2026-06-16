import type { CompareMetricDef } from '../../lib/compareMetrics';

type Props = {
  metric: CompareMetricDef;
  dotClassName?: string;
};

export default function CompareMetricLabel({ metric, dotClassName = 'compare-metric-dot' }: Props) {
  return (
    <span className="compare-metric-label-inner">
      {metric.colorVar ? (
        <span
          className={`${dotClassName} compare-metric-dot--table`}
          style={{ background: metric.colorVar }}
          aria-hidden
        />
      ) : null}
      <span>{metric.label}</span>
    </span>
  );
}

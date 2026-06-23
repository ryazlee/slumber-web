/** Matches share export chip tiers — adapted for inline post stage metrics (no pill padding). */

export type StageMetricSize = 'regular' | 'compact' | 'tight' | 'mini';

const STAGE_METRIC_SIZES: Record<
  StageMetricSize,
  { fontSize: number; columnGap: number }
> = {
  regular: { fontSize: 13, columnGap: 20 },
  compact: { fontSize: 11, columnGap: 12 },
  tight: { fontSize: 10, columnGap: 8 },
  mini: { fontSize: 9, columnGap: 6 },
};

function estimateLabelWidth(label: string, size: StageMetricSize): number {
  const { fontSize } = STAGE_METRIC_SIZES[size];
  return label.length * fontSize * 0.54 + 2;
}

function rowWidth(labels: string[], size: StageMetricSize): number {
  if (!labels.length) return 0;
  const { columnGap } = STAGE_METRIC_SIZES[size];
  const chips = labels.reduce((sum, label) => sum + estimateLabelWidth(label, size), 0);
  return chips + columnGap * (labels.length - 1);
}

export function pickStageMetricRowSize(
  labels: string[],
  availableWidth: number,
): { size: StageMetricSize; fontSize: number; columnGap: number } {
  const sizes: StageMetricSize[] = ['regular', 'compact', 'tight', 'mini'];
  const width = Math.max(0, availableWidth - 4);

  for (const size of sizes) {
    if (rowWidth(labels, size) <= width) {
      return { size, ...STAGE_METRIC_SIZES[size] };
    }
  }

  return { size: 'mini', ...STAGE_METRIC_SIZES.mini };
}

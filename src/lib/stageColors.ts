export type StageKey = 'deep' | 'rem' | 'core' | 'awake';

const STAGE_COLORS: Record<StageKey, string> = {
  deep: 'var(--deep)',
  rem: 'var(--rem)',
  core: 'var(--core)',
  awake: 'var(--awake)',
};

export function stageColor(key: StageKey): string {
  return STAGE_COLORS[key];
}

export function dominantStageColor(post: {
  asleepMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
}): string {
  const stages: Array<{ key: StageKey; mins: number }> = [
    { key: 'deep', mins: post.deepMinutes },
    { key: 'rem', mins: post.remMinutes },
    { key: 'core', mins: post.coreMinutes },
  ];
  const top = stages.sort((a, b) => b.mins - a.mins)[0];
  return top && top.mins > 0 ? stageColor(top.key) : 'var(--accent)';
}

import { formatMins, goalHours, pluralCount } from './format';

export const DRAWING_KIND_LABEL = 'Prize drawing';

export type DrawingEntryKindId = 'goal' | 'referral';

export type DrawingEntryKindDef = {
  kind: DrawingEntryKindId;
  label: string;
  adminHint: string;
  perEvent: boolean;
};

export const DRAWING_ENTRY_KIND_CATALOG: DrawingEntryKindDef[] = [
  {
    kind: 'goal',
    label: 'Goal',
    adminHint: 'Awarded when they hit the wearable sleep goal (or AMOE).',
    perEvent: false,
  },
  {
    kind: 'referral',
    label: 'Referrals',
    adminHint: 'Awarded per new account from your invite that posts sleep, up to the max.',
    perEvent: true,
  },
];

export type DrawingEntryRule = {
  kind: DrawingEntryKindId;
  enabled: boolean;
  entries: number;
  max: number;
};

export type DrawingEntrySlice = {
  kind: DrawingEntryKindId;
  label: string;
  earned: number;
  max: number;
};

export type DrawingEntryBreakdown = {
  slices: DrawingEntrySlice[];
  earned: number;
  max: number;
  qualified: boolean;
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function defaultDrawingEntryConfig(): DrawingEntryRule[] {
  return [
    { kind: 'goal', enabled: true, entries: 1, max: 1 },
    { kind: 'referral', enabled: false, entries: 1, max: 5 },
  ];
}

export function parseDrawingEntryConfig(
  raw: unknown,
  isDrawing = true,
  legacyReferrals = false,
): DrawingEntryRule[] {
  const defaults = defaultDrawingEntryConfig();
  if (!isDrawing) {
    return defaults.map((rule) => ({ ...rule, enabled: false, entries: 0, max: 0 }));
  }
  const rows = Array.isArray(raw) ? raw : [];
  return defaults.map((fallback) => {
    const found = rows.find((row) => (
      row
      && typeof row === 'object'
      && (row as { kind?: string }).kind === fallback.kind
    )) as { enabled?: unknown; entries?: unknown; max?: unknown } | undefined;
    if (!found) {
      if (fallback.kind === 'referral' && legacyReferrals) {
        return { ...fallback, enabled: true, entries: 0, max: fallback.max };
      }
      return fallback;
    }
    const entries = clampInt(found.entries, fallback.kind === 'goal' ? 1 : 0, 20, fallback.entries);
    const enabled = fallback.kind === 'goal' ? true : found.enabled !== false && found.enabled !== 0;
    const max = fallback.kind === 'goal'
      ? entries
      : Math.max(entries, clampInt(found.max, 0, 100, fallback.max));
    return { kind: fallback.kind, enabled, entries, max };
  });
}

function goalQualified(opts: {
  accruedMinutes: number;
  goalMinutes: number;
  ineligible?: boolean;
  alternate?: boolean;
}): boolean {
  if (opts.ineligible) return false;
  if (opts.alternate) return true;
  if (!Number.isFinite(opts.accruedMinutes) || !Number.isFinite(opts.goalMinutes) || opts.goalMinutes <= 0) {
    return false;
  }
  return opts.accruedMinutes >= opts.goalMinutes;
}

export function drawingEntryBreakdown(opts: {
  config?: unknown;
  isDrawing?: boolean;
  drawingReferrals?: boolean;
  accruedMinutes: number;
  goalMinutes: number;
  referralsQualified?: number;
  ineligible?: boolean;
  alternate?: boolean;
}): DrawingEntryBreakdown {
  const rules = parseDrawingEntryConfig(
    opts.config,
    opts.isDrawing !== false,
    opts.drawingReferrals === true,
  );
  const qualified = goalQualified(opts);
  const slices: DrawingEntrySlice[] = [];

  for (const def of DRAWING_ENTRY_KIND_CATALOG) {
    const rule = rules.find((row) => row.kind === def.kind);
    if (!rule?.enabled || rule.max <= 0) continue;
    let earned = 0;
    if (def.kind === 'goal') {
      earned = qualified ? rule.entries : 0;
    } else if (def.kind === 'referral') {
      const events = Math.max(0, opts.referralsQualified ?? 0);
      earned = Math.min(rule.max, events * rule.entries);
    }
    slices.push({ kind: def.kind, label: def.label, earned, max: rule.max });
  }

  const earned = slices.reduce((sum, slice) => sum + slice.earned, 0);
  const max = slices.reduce((sum, slice) => sum + slice.max, 0);
  return { slices, earned, max, qualified: earned > 0 };
}

export function drawingEntryCount(
  accruedMinutes: number,
  goalMinutes: number,
  opts?: { ineligible?: boolean; alternate?: boolean; config?: unknown; isDrawing?: boolean },
): number {
  return drawingEntryBreakdown({
    accruedMinutes,
    goalMinutes,
    ineligible: opts?.ineligible,
    alternate: opts?.alternate,
    config: opts?.config,
    isDrawing: opts?.isDrawing,
  }).earned;
}

export type DrawingReferralCounts = Record<string, { signups: number; qualified: number }>;

export function parseDrawingReferralCounts(raw: unknown): Record<string, DrawingReferralCounts> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, DrawingReferralCounts> = {};
  for (const [challengeId, referrers] of Object.entries(raw as Record<string, unknown>)) {
    if (!referrers || typeof referrers !== 'object' || Array.isArray(referrers)) continue;
    const counts: DrawingReferralCounts = {};
    for (const [userId, row] of Object.entries(referrers as Record<string, unknown>)) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      const signups = Number((row as { signups?: unknown }).signups);
      const qualified = Number((row as { qualified?: unknown }).qualified);
      counts[userId] = {
        signups: Number.isFinite(signups) ? Math.max(0, Math.round(signups)) : 0,
        qualified: Number.isFinite(qualified) ? Math.max(0, Math.round(qualified)) : 0,
      };
    }
    out[challengeId] = counts;
  }
  return out;
}

export function referralQualifiedByReferrer(
  counts?: DrawingReferralCounts | null,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!counts) return out;
  for (const [userId, row] of Object.entries(counts)) {
    out[userId] = row.qualified;
  }
  return out;
}

export function drawingPoolTotal(opts: {
  config?: unknown;
  isDrawing?: boolean;
  drawingReferrals?: boolean;
  goalMinutes: number;
  people: Array<{
    userId: string;
    accruedMinutes: number;
    referredBy?: string | null;
    ineligible?: boolean;
    alternate?: boolean;
    hasPostedSleep?: boolean;
  }>;
  referralQualifiedByReferrer?: Record<string, number>;
}): number {
  return opts.people.reduce((sum, person) => {
    const referralsQualified = opts.referralQualifiedByReferrer?.[person.userId]
      ?? opts.people.filter(
        (other) => other.referredBy === person.userId && other.hasPostedSleep,
      ).length;
    return sum + drawingEntryBreakdown({
      config: opts.config,
      isDrawing: opts.isDrawing,
      drawingReferrals: opts.drawingReferrals,
      accruedMinutes: person.accruedMinutes,
      goalMinutes: opts.goalMinutes,
      referralsQualified,
      ineligible: person.ineligible,
      alternate: person.alternate,
    }).earned;
  }, 0);
}

export function drawingHowItWorksLine(
  goalMinutes: number,
  config?: unknown,
  isDrawing = true,
): string {
  const rules = parseDrawingEntryConfig(config, isDrawing);
  const goal = rules.find((rule) => rule.kind === 'goal');
  const referral = rules.find((rule) => rule.kind === 'referral' && rule.enabled && rule.max > 0);
  const goalBit = `Hit ${goalHours(goalMinutes)} of wearable sleep for ${pluralCount(goal?.entries ?? 1, 'entry')}.`;
  const referralBit = referral
    ? referral.entries <= 0
      ? ' Invite friends to join.'
      : ` Invite friends who sign up and post sleep for ${pluralCount(referral.entries, 'entry')} each (up to ${referral.max}).`
    : '';
  return `${goalBit}${referralBit} Winner chosen in a drawing after it ends.`;
}

export function drawingStatusCopy(opts: {
  accruedMinutes: number;
  goalMinutes: number;
  entries: number;
  max?: number;
  pool?: number;
  completed?: boolean;
}): { entriesLabel: string; detail: string; qualified: boolean } {
  const qualified = opts.entries > 0;
  const max = opts.max ?? null;
  const entriesLabel = max != null && max > 0
    ? `${opts.entries} / ${max}`
    : pluralCount(opts.entries, 'entry');
  if (opts.completed) {
    return {
      entriesLabel,
      qualified,
      detail: qualified
        ? 'Drawing happens outside the app.'
        : `Needed ${goalHours(opts.goalMinutes)} in the window.`,
    };
  }
  if (qualified) {
    const pool = opts.pool != null && opts.pool > 0
      ? `${pluralCount(opts.pool, 'entry')} in the drawing`
      : 'You’re in the drawing';
    return { entriesLabel, qualified, detail: pool };
  }
  const remain = Math.max(0, opts.goalMinutes - opts.accruedMinutes);
  return {
    entriesLabel,
    qualified,
    detail: remain > 0 ? `${formatMins(remain)} to go` : 'Hit the goal to enter',
  };
}

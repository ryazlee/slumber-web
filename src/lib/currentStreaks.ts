import { supabase } from './supabase';

type Pending = {
  resolve: (n: number) => void;
  reject: (err: unknown) => void;
};

type StreakRow = {
  user_id?: string | null;
  current_streak?: number | string | null;
};

const queue = new Map<string, Pending[]>();
let flushScheduled = false;

function isUndefinedFunctionError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = `${error.code ?? ''} ${error.message ?? ''}`;
  return /42883|PGRST202|Could not find the function|schema cache/i.test(msg);
}

function parseStreakCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

function parseUserId(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value != null && typeof value !== 'object') {
    const s = String(value);
    return s.length > 0 ? s : null;
  }
  return null;
}

async function fetchCurrentStreakMapViaSelect(userIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (const id of userIds) out.set(id, 0);
  const { data, error } = await supabase
    .from('streaks')
    .select('user_id, current_streak')
    .in('user_id', userIds);
  if (error) throw error;
  for (const row of (data ?? []) as StreakRow[]) {
    const id = parseUserId(row.user_id);
    if (!id) continue;
    out.set(id, parseStreakCount(row.current_streak));
  }
  return out;
}

async function flushQueue(): Promise<void> {
  flushScheduled = false;
  const batch = queue;
  queue.clear();
  const ids = [...batch.keys()];
  if (ids.length === 0) return;

  try {
    const map = await fetchCurrentStreakMap(ids);
    for (const [id, waiters] of batch) {
      const n = map.get(id) ?? 0;
      for (const w of waiters) w.resolve(n);
    }
  } catch (err) {
    for (const waiters of batch.values()) {
      for (const w of waiters) w.reject(err);
    }
  }
}

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    void flushQueue();
  });
}

export function fetchCurrentStreak(userId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const waiters = queue.get(userId) ?? [];
    waiters.push({ resolve, reject });
    queue.set(userId, waiters);
    scheduleFlush();
  });
}

export async function fetchCurrentStreakMap(userIds: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, number>();
  if (unique.length === 0) return out;

  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const { data, error } = await supabase.rpc('get_current_streaks', {
      p_user_ids: chunk,
    });
    if (error) {
      if (isUndefinedFunctionError(error)) {
        const fallback = await fetchCurrentStreakMapViaSelect(chunk);
        for (const [id, n] of fallback) out.set(id, n);
        continue;
      }
      throw error;
    }
    for (const id of chunk) out.set(id, 0);
    for (const row of (data ?? []) as StreakRow[]) {
      const id = parseUserId(row.user_id);
      if (!id) continue;
      out.set(id, parseStreakCount(row.current_streak));
    }
  }
  return out;
}

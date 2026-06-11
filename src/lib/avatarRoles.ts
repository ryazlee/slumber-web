import { supabase } from './supabase';

export type AvatarRoleStyle = {
  key: string;
  label: string;
  badge: string;
  color: string;
  badgeColor?: string;
};

const FALLBACK_STYLES: Record<string, AvatarRoleStyle> = {
  premium: { key: 'premium', label: 'Premium', color: '#9B7EDE', badge: '💎' },
  developer: { key: 'developer', label: 'Developer', color: '#FFD700', badge: '✦' },
  founder: { key: 'founder', label: 'Founder', color: '#22C55E', badge: '🐸', badgeColor: '#16A34A' },
  early_bird: { key: 'early_bird', label: 'Early bird', color: '#FF9F43', badge: '🌅' },
  night_owl: { key: 'night_owl', label: 'Night owl', color: '#5F27CD', badge: '🦉' },
  streak_fire: { key: 'streak_fire', label: 'On fire', color: '#FF6B35', badge: '🔥' },
  champion: { key: 'champion', label: 'Champion', color: '#F1C40F', badge: '🏆' },
  beta_tester: { key: 'beta_tester', label: 'Beta tester', color: '#00D2D3', badge: '🧪' },
  sleep_guru: { key: 'sleep_guru', label: 'Sleep guru', color: '#74B9FF', badge: '🌙' },
  dreamer: { key: 'dreamer', label: 'Dreamer', color: '#A29BFE', badge: '💭' },
  coffee_powered: { key: 'coffee_powered', label: 'Coffee powered', color: '#6F4E37', badge: '☕️' },
};

let _styleMap: Map<string, AvatarRoleStyle> | null = null;

function fallbackMap(): Map<string, AvatarRoleStyle> {
  return new Map(Object.entries(FALLBACK_STYLES));
}

export async function loadAvatarRoleStyles(): Promise<Map<string, AvatarRoleStyle>> {
  if (_styleMap) return _styleMap;

  const { data, error } = await supabase
    .from('role_definitions')
    .select('key, label, badge, ring_color, badge_color')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    _styleMap = fallbackMap();
    return _styleMap;
  }

  _styleMap = new Map(
    data.map((row) => [
      row.key as string,
      {
        key: row.key as string,
        label: row.label as string,
        badge: row.badge as string,
        color: row.ring_color as string,
        badgeColor: (row.badge_color as string | null) ?? undefined,
      },
    ]),
  );
  return _styleMap;
}

export function getCachedAvatarRoleStyles(): Map<string, AvatarRoleStyle> {
  return _styleMap ?? fallbackMap();
}

export function normalizeUserRoles(userRoles?: string[] | null): string[] {
  if (!userRoles?.length) return [];
  const known = getCachedAvatarRoleStyles();
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const key of userRoles) {
    if (known.has(key) && !seen.has(key)) {
      seen.add(key);
      normalized.push(key);
    }
  }
  return normalized;
}

/** First role in user_roles drives the avatar ring (matches iOS). */
export function resolveAvatarRole(userRoles?: string[] | null): AvatarRoleStyle | undefined {
  const first = normalizeUserRoles(userRoles)[0];
  return first ? getCachedAvatarRoleStyles().get(first) : undefined;
}

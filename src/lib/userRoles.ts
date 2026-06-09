import { supabase } from './supabase';

export type RoleOption = {
  key: string;
  label: string;
  badge: string;
};

/** Offline / pre-migration fallback — matches migration 047 seed. */
const FALLBACK_ROLE_OPTIONS: RoleOption[] = [
  { key: 'developer', label: 'Developer', badge: '✦' },
  { key: 'founder', label: 'Founder', badge: '🐸' },
  { key: 'premium', label: 'Premium', badge: '💎' },
  { key: 'champion', label: 'Champion', badge: '🏆' },
  { key: 'beta_tester', label: 'Beta tester', badge: '🧪' },
  { key: 'sleep_guru', label: 'Sleep guru', badge: '🌙' },
  { key: 'streak_fire', label: 'On fire', badge: '🔥' },
  { key: 'early_bird', label: 'Early bird', badge: '🌅' },
  { key: 'night_owl', label: 'Night owl', badge: '🦉' },
  { key: 'dreamer', label: 'Dreamer', badge: '💭' },
  { key: 'coffee_powered', label: 'Coffee powered', badge: '☕️' },
];

let _options: RoleOption[] | null = null;
let _labelMap: Map<string, RoleOption> | null = null;

function labelMap(): Map<string, RoleOption> {
  if (_labelMap) return _labelMap;
  const opts = _options ?? FALLBACK_ROLE_OPTIONS;
  _labelMap = new Map(opts.map((r) => [r.key, r]));
  return _labelMap;
}

/** Fetch assignable roles from role_definitions (cached). */
export async function loadRoleDefinitions(): Promise<RoleOption[]> {
  if (_options) return _options;

  const { data, error } = await supabase
    .from('role_definitions')
    .select('key, label, badge')
    .eq('assignable', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    _options = FALLBACK_ROLE_OPTIONS;
  } else {
    _options = data as RoleOption[];
  }
  _labelMap = new Map(_options.map((r) => [r.key, r]));
  return _options;
}

export function getCachedRoleOptions(): RoleOption[] {
  return _options ?? FALLBACK_ROLE_OPTIONS;
}

export function formatRoleLabel(key: string): string {
  const role = labelMap().get(key);
  return role ? `${role.badge} ${role.label}` : key;
}

export function formatRoleList(roles: string[] | null | undefined): string {
  if (!roles?.length) return '—';
  return roles.map(formatRoleLabel).join(' · ');
}

export function clearRoleDefinitionCache() {
  _options = null;
  _labelMap = null;
}

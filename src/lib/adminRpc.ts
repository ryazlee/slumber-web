import type { PostgrestError } from '@supabase/supabase-js';

/** True when PostgREST cannot find an RPC (signature mismatch / migration not applied). */
export function isMissingAdminRpc(err: PostgrestError, rpcName: string): boolean {
  const msg = err.message ?? '';
  return err.code === 'PGRST202'
    || err.code === '42883'
    || new RegExp(rpcName, 'i').test(msg);
}

export const ADMIN_MIGRATION_HINT = 'Run `supabase db push` from the repo root to apply pending migrations.';

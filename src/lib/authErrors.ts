import { AuthError } from '@supabase/supabase-js';

export function formatAuthError(err: unknown): string {
  if (err instanceof AuthError) {
    const parts = [err.message];
    const isEmailSendFailure =
      err.code === 'unexpected_failure' ||
      /sending (magic link|confirmation) (email|mail)/i.test(err.message);
    if (isEmailSendFailure) {
      parts.push(
        'Supabase could not send the email — this is not fixed by SQL migrations. In the dashboard: Project Settings → Authentication → SMTP (verify host, port 587, credentials, and sender domain), then Authentication → Logs for the underlying SMTP error.',
      );
    } else if (err.status === 500) {
      parts.push('Check Authentication → Logs in the Supabase dashboard for details.');
    }
    if (err.code) parts.push(`(${err.code})`);
    return parts.join(' ');
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

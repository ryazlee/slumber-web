import { getAuthCallbackUrl } from '../authRedirect';
import { formatAuthError } from '../authErrors';
import { supabase } from '../supabase';

function oauthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('user already registered') || lower.includes('identity is already linked')) {
    return 'This Google account is already linked to another Slumber user.';
  }
  if (lower.includes('email address is already registered')) {
    return 'An account with this email already exists. Sign in with email, or use the same Google address to link automatically.';
  }
  return message;
}

/**
 * Redirects the browser to Google OAuth. Callback lands on `/login-callback`.
 * Supabase links the Google identity when the email matches an existing verified account.
 */
export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  });

  if (error) {
    throw new Error(oauthErrorMessage(formatAuthError(error)));
  }

  if (!data.url) {
    throw new Error('Could not start Google sign-in.');
  }

  window.location.assign(data.url);
}

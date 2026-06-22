import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export type AuthCallbackResult =
  | { status: 'session'; session: Session }
  | { status: 'error'; message: string }
  | { status: 'noop' };

function parseCallbackUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function hashParams(url: URL): URLSearchParams | null {
  if (!url.hash || url.hash === '#') return null;
  return new URLSearchParams(url.hash.replace(/^#/, ''));
}

function authErrorMessage(error: string | null, description: string | null): string {
  const code = (error ?? '').toLowerCase();
  if (code === 'access_denied') return 'Sign-in was cancelled.';
  if (description?.trim()) return description.trim();
  if (error?.trim()) return error.trim();
  return 'Sign-in link failed. Enter the 6-digit code from your email instead.';
}

function exchangeErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('flow state') || lower.includes('code verifier') || lower.includes('pkce')) {
    return 'This link must be opened in the same browser where you requested the code. Enter the 6-digit code instead, or request a new one.';
  }
  if (lower.includes('expired') || lower.includes('invalid') || lower.includes('already been used')) {
    return 'This sign-in link has expired or was already used. Request a new code on the sign-in page.';
  }
  return message;
}

/** Exchange a Supabase auth redirect URL for a browser session (magic link / OAuth). */
export async function createSessionFromUrl(url: string): Promise<AuthCallbackResult> {
  const parsed = parseCallbackUrl(url);
  if (!parsed) return { status: 'noop' };

  const query = parsed.searchParams;
  const fragment = hashParams(parsed);

  const oauthError = query.get('error') ?? fragment?.get('error') ?? null;
  if (oauthError) {
    const description = query.get('error_description') ?? fragment?.get('error_description') ?? null;
    return { status: 'error', message: authErrorMessage(oauthError, description) };
  }

  const code = query.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { status: 'error', message: exchangeErrorMessage(error.message) };
    if (!data.session) {
      return {
        status: 'error',
        message: 'Sign-in link did not return a session. Enter the 6-digit code from your email instead.',
      };
    }
    return { status: 'session', session: data.session };
  }

  const tokenHash = query.get('token_hash');
  const otpType = query.get('type');
  if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as EmailOtpType,
    });
    if (error) return { status: 'error', message: exchangeErrorMessage(error.message) };
    if (!data.session) {
      return {
        status: 'error',
        message: 'Sign-in link did not return a session. Enter the 6-digit code from your email instead.',
      };
    }
    return { status: 'session', session: data.session };
  }

  const accessToken = fragment?.get('access_token') ?? query.get('access_token');
  const refreshToken = fragment?.get('refresh_token') ?? query.get('refresh_token');
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { status: 'error', message: exchangeErrorMessage(error.message) };
    if (!data.session) {
      return {
        status: 'error',
        message: 'Sign-in link did not return a session. Enter the 6-digit code from your email instead.',
      };
    }
    return { status: 'session', session: data.session };
  }

  return { status: 'noop' };
}

export function hasAuthCallbackParams(url: string): boolean {
  return /[?&#](code|access_token|token_hash|error)=/.test(url);
}

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DeepLinkLanding, { DeepLinkNotFound } from '../components/DeepLinkLanding';
import { parseContentLinkPath } from '../lib/deepLinks';
import { supabase } from '../lib/supabase';

type ProfilePreview = {
  valid?: boolean;
  username?: string;
};

type PostPreview = {
  valid?: boolean;
  title?: string;
  username?: string;
  sleepDate?: string;
};

type ChallengePreview = {
  valid?: boolean;
  title?: string | null;
  goalMinutes?: number;
  hostUsername?: string;
  isGroup?: boolean;
  status?: string;
};

function formatGoal(minutes?: number): string {
  if (!minutes) return '';
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h sleep goal`;
}

export default function ContentLandingPage() {
  const { pathname } = useLocation();
  const target = useMemo(() => parseContentLinkPath(pathname), [pathname]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);
  const [challengePreview, setChallengePreview] = useState<ChallengePreview | null>(null);

  useEffect(() => {
    if (!target) {
      setError('This link is invalid.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfilePreview(null);
    setPostPreview(null);
    setChallengePreview(null);

    (async () => {
      try {
        if (target.kind === 'profile') {
          const { data, error: rpcError } = await supabase.rpc('get_profile_link_preview', {
            p_user_id: target.userId,
          });
          if (cancelled) return;
          if (rpcError) {
            setError('Could not load this profile.');
            return;
          }
          const row = data as ProfilePreview;
          if (!row?.valid) {
            setError('This profile could not be found.');
            return;
          }
          setProfilePreview(row);
          return;
        }

        if (target.kind === 'post') {
          const { data, error: rpcError } = await supabase.rpc('get_post_link_preview', {
            p_post_id: target.postId,
          });
          if (cancelled) return;
          if (rpcError) {
            setError('Could not load this post.');
            return;
          }
          const row = data as PostPreview;
          if (!row?.valid) {
            setError('This post is unavailable or private.');
            return;
          }
          setPostPreview(row);
          return;
        }

        const { data, error: rpcError } = await supabase.rpc('get_challenge_link_preview', {
          p_challenge_id: target.challengeId,
        });
        if (cancelled) return;
        if (rpcError) {
          setError('Could not load this challenge.');
          return;
        }
        const row = data as ChallengePreview;
        if (!row?.valid) {
          setError('This challenge could not be found.');
          return;
        }
        setChallengePreview(row);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [target]);

  if (!target) {
    return (
      <DeepLinkNotFound message="This URL doesn't match a post, profile, or challenge." />
    );
  }

  if (target.kind === 'profile') {
    const username = profilePreview?.username ? `@${profilePreview.username}` : 'Slumber user';
    return (
      <DeepLinkLanding
        intent="profile"
        title={loading ? 'Profile' : username}
        subtitle={loading ? undefined : 'View sleep stats and posts'}
        meta={loading ? undefined : 'Follow and compare sleep in the app'}
        schemePath={target.schemePath}
        loading={loading}
        error={error}
      />
    );
  }

  if (target.kind === 'post') {
    const title = postPreview?.title?.trim() || 'Sleep log';
    const author = postPreview?.username ? `@${postPreview.username}` : 'a friend';
    const date = postPreview?.sleepDate ?? '';

    return (
      <DeepLinkLanding
        intent="post"
        title={loading ? 'Sleep post' : title}
        subtitle={loading ? undefined : author}
        meta={loading ? undefined : (date ? `Night of ${date}` : 'Open the full sleep log in Slumber')}
        schemePath={target.schemePath}
        loading={loading}
        error={error}
      />
    );
  }

  const title = challengePreview?.title?.trim()
    || (challengePreview?.isGroup ? 'Group challenge' : 'Sleep challenge');
  const host = challengePreview?.hostUsername ? `@${challengePreview.hostUsername}` : 'a friend';

  return (
    <DeepLinkLanding
      intent="challenge"
      title={loading ? 'Challenge' : title}
      subtitle={loading ? undefined : `Hosted by ${host}`}
      meta={loading
        ? undefined
        : `${formatGoal(challengePreview?.goalMinutes)} · view standings in the app`}
      schemePath={target.schemePath}
      loading={loading}
      error={error}
    />
  );
}

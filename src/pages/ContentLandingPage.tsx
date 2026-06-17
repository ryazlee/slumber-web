import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DeepLinkLanding, { DeepLinkNotFound } from '../components/DeepLinkLanding';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { parseContentLinkPath } from '../lib/deepLinks';
import { formatMins, formatSleepDate, getOgImageUrl, getSiteUrl } from '../lib/siteUrl';
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
  asleepMinutes?: number;
  bedtime?: string;
  wakeTime?: string;
};

type ChallengePreview = {
  valid?: boolean;
  title?: string | null;
  goalMinutes?: number;
  hostUsername?: string;
  isGroup?: boolean;
  status?: string;
  participantCount?: number;
};

function formatGoal(minutes?: number): string {
  if (!minutes) return '';
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h sleep goal`;
}

function postDisplayTitle(row: PostPreview): string {
  const username = row.username ? `@${row.username}` : 'Someone';
  const customTitle = row.title?.trim();
  const hasCustomTitle = !!customTitle && customTitle !== 'Sleep log';
  const asleep = row.asleepMinutes ? formatMins(row.asleepMinutes) : null;

  if (hasCustomTitle) return `${customTitle} · ${username}`;
  if (asleep) return `${username} slept ${asleep}`;
  return `${username}'s sleep log`;
}

function postMetaDescription(row: PostPreview): string {
  const parts: string[] = [];
  if (row.sleepDate) parts.push(`Night of ${formatSleepDate(row.sleepDate)}`);
  if (row.asleepMinutes) parts.push(`${formatMins(row.asleepMinutes)} asleep`);
  if (row.bedtime && row.wakeTime) parts.push(`${row.bedtime} – ${row.wakeTime}`);
  parts.push('Open in Slumber');
  return parts.join(' · ');
}

export default function ContentLandingPage() {
  const { pathname } = useLocation();
  const target = useMemo(() => parseContentLinkPath(pathname), [pathname]);
  const siteUrl = getSiteUrl();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);
  const [challengePreview, setChallengePreview] = useState<ChallengePreview | null>(null);

  const documentMeta = useMemo(() => {
    if (!target || loading || error) return null;

    const ogImage = getOgImageUrl();

    if (target.kind === 'profile' && profilePreview?.valid) {
      const handle = profilePreview.username ? `@${profilePreview.username}` : 'Slumber user';
      return {
        title: `${handle} · Slumber`,
        description: 'View sleep stats and posts · Follow friends on Slumber',
        image: ogImage,
        url: `${siteUrl}/profile/${target.userId}`,
      };
    }

    if (target.kind === 'post' && postPreview?.valid) {
      return {
        title: `${postDisplayTitle(postPreview)} · Slumber`,
        description: postMetaDescription(postPreview),
        image: ogImage,
        url: `${siteUrl}/post/${target.postId}`,
      };
    }

    if (target.kind === 'challenge' && challengePreview?.valid) {
      const challengeTitle = challengePreview.title?.trim()
        || (challengePreview.isGroup ? 'Group sleep challenge' : 'Sleep challenge');
      const host = challengePreview.hostUsername ? `@${challengePreview.hostUsername}` : 'a friend';
      const goal = formatGoal(challengePreview.goalMinutes);
      const racers = challengePreview.participantCount
        ? `${challengePreview.participantCount} racers`
        : null;
      const descriptionParts = [`Hosted by ${host}`];
      if (goal) descriptionParts.push(goal);
      if (racers) descriptionParts.push(racers);
      descriptionParts.push('Join in Slumber');

      return {
        title: `${challengeTitle} · Slumber`,
        description: descriptionParts.join(' · '),
        image: ogImage,
        url: `${siteUrl}/challenge/${target.challengeId}`,
      };
    }

    return null;
  }, [
    target,
    loading,
    error,
    profilePreview,
    postPreview,
    challengePreview,
    siteUrl,
  ]);

  useDocumentMeta(documentMeta);

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
    return (
      <DeepLinkLanding
        intent="post"
        title={loading ? 'Sleep post' : postDisplayTitle(postPreview ?? {})}
        subtitle={loading ? undefined : (postPreview?.username ? `@${postPreview.username}` : 'a friend')}
        meta={loading ? undefined : (postPreview ? postMetaDescription(postPreview) : 'Open the full sleep log in Slumber')}
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
        : `${formatGoal(challengePreview?.goalMinutes)}${challengePreview?.participantCount ? ` · ${challengePreview.participantCount} racers` : ''} · view standings in the app`}
      schemePath={target.schemePath}
      loading={loading}
      error={error}
    />
  );
}

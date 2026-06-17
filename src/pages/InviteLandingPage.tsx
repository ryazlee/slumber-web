import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DeepLinkLanding, { DeepLinkNotFound } from '../components/DeepLinkLanding';
import { parseInviteLinkPath } from '../lib/deepLinks';
import { supabase } from '../lib/supabase';

type FriendPreview = {
  valid?: boolean;
  username?: string;
};

type ChallengePreview = {
  challengeId?: string;
  title?: string | null;
  goalMinutes?: number;
  hostUsername?: string;
  participantCount?: number;
  joinable?: boolean;
  joinableReason?: string;
};

type ClubPreview = {
  clubId?: string;
  name?: string;
  emoji?: string | null;
  memberCount?: number;
  joinable?: boolean;
  joinableReason?: string;
};

function formatGoal(minutes?: number): string {
  if (!minutes) return '';
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h sleep goal`;
}

export default function InviteLandingPage() {
  const { pathname } = useLocation();
  const target = useMemo(() => parseInviteLinkPath(pathname), [pathname]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendPreview, setFriendPreview] = useState<FriendPreview | null>(null);
  const [challengePreview, setChallengePreview] = useState<ChallengePreview | null>(null);
  const [clubPreview, setClubPreview] = useState<ClubPreview | null>(null);

  useEffect(() => {
    if (!target) {
      setError('This link is invalid.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setFriendPreview(null);
    setChallengePreview(null);
    setClubPreview(null);

    (async () => {
      try {
        if (target.kind === 'friend') {
          const { data, error: rpcError } = await supabase.rpc('get_friend_invite_preview', {
            p_token: target.token,
          });
          if (cancelled) return;
          if (rpcError) {
            setError('Could not load this invite.');
            return;
          }
          const row = data as FriendPreview;
          if (!row?.valid) {
            setError('This invite link is invalid or expired.');
            return;
          }
          setFriendPreview(row);
          return;
        }

        if (target.kind === 'challenge') {
          const { data, error: rpcError } = await supabase.rpc('get_challenge_join_preview', {
            p_token: target.token,
          });
          if (cancelled) return;
          if (rpcError) {
            setError('Could not load this challenge.');
            return;
          }
          const row = data as ChallengePreview;
          if (!row?.challengeId) {
            setError('This challenge link is invalid or expired.');
            return;
          }
          setChallengePreview(row);
          if (!row.joinable && row.joinableReason) {
            setError(row.joinableReason);
          }
          return;
        }

        const { data, error: rpcError } = await supabase.rpc('get_club_invite_preview', {
          p_club_id: target.clubId,
          p_token: target.token,
        });
        if (cancelled) return;
        if (rpcError) {
          setError('Could not load this club invite.');
          return;
        }
        const row = data as ClubPreview;
        if (!row?.clubId) {
          setError('This club invite link is invalid or expired.');
          return;
        }
        setClubPreview(row);
        if (!row.joinable && row.joinableReason) {
          setError(row.joinableReason);
        }
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
      <DeepLinkNotFound message="This URL doesn't match a friend, challenge, or club invite." />
    );
  }

  if (target.kind === 'friend') {
    const username = friendPreview?.username ? `@${friendPreview.username}` : 'a friend';
    return (
      <DeepLinkLanding
        intent="friend-invite"
        title={loading ? 'Friend invite' : `Join ${username}`}
        subtitle={loading ? undefined : 'Add them on Slumber and share sleep with friends.'}
        meta={loading ? undefined : 'Sleep tracking · challenges · stats'}
        schemePath={target.schemePath}
        loading={loading}
        error={error}
      />
    );
  }

  if (target.kind === 'challenge') {
    const title = challengePreview?.title?.trim() || 'Sleep challenge';
    const host = challengePreview?.hostUsername ? `@${challengePreview.hostUsername}` : 'a friend';
    const racers = challengePreview?.participantCount ?? 0;

    return (
      <DeepLinkLanding
        intent="challenge-join"
        title={loading ? 'Join challenge' : title}
        subtitle={loading ? undefined : `Hosted by ${host}`}
        meta={loading
          ? undefined
          : `${formatGoal(challengePreview?.goalMinutes)} · ${racers} racer${racers === 1 ? '' : 's'}`}
        schemePath={target.schemePath}
        loading={loading}
        error={error}
      />
    );
  }

  const clubName = clubPreview?.name?.trim() || 'Sleep club';
  const members = clubPreview?.memberCount ?? 0;

  return (
    <DeepLinkLanding
      intent="club-invite"
      title={loading ? 'Club invite' : clubName}
      subtitle={loading ? undefined : 'Join this sleep club on Slumber'}
      meta={loading ? undefined : `${members} member${members === 1 ? '' : 's'}`}
      previewEmoji={clubPreview?.emoji}
      schemePath={target.schemePath}
      loading={loading}
      error={error}
    />
  );
}

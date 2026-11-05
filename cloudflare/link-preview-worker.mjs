/**
 * Cloudflare Worker — HTTP 200 + Open Graph shell for Slumber deep links.
 *
 * GitHub Pages serves 404.html for /challenge/join/*, /invite/*, etc., but keeps
 * status 404. iMessage and Messenger often skip rich previews on non-200 responses
 * even when og:image tags are present.
 *
 * This worker:
 * 1. Passes through normal 200 responses (assets, marketing pages, og-image.png).
 * 2. For deep-link / legal paths that 404, re-serves index.html with status 200.
 * 3. Rewrites og/twitter title, description, and url for the shared path.
 * 4. Optionally enriches invite/challenge/club/post titles via Supabase RPCs
 *    (SUPABASE_URL + SUPABASE_ANON_KEY worker secrets).
 *
 * Setup: see cloudflare/README.md
 */

const DEEP_LINK_PREFIXES = [
  '/invite/',
  '/open',
  '/open/',
  '/post/',
  '/profile/',
  '/challenge/',
  '/challenges/',
  '/club/',
  '/recap/',
  '/login-callback',
  '/health-callback',
];

/** Exact public routes store crawlers fetch (Play privacy / deletion URLs, etc.). */
const STATIC_PUBLIC_PATHS = new Set([
  '/privacy',
  '/privacy/',
  '/terms',
  '/terms/',
  '/prize-drawing-rules',
  '/prize-drawing-rules/',
  '/delete-account',
  '/delete-account/',
  '/delete-data',
  '/delete-data/',
  '/home',
  '/home/',
  '/download',
  '/download/',
  '/contact',
  '/contact/',
]);

const DEFAULT_DESCRIPTION =
  "You're invited to try social sleep tracking for iOS and Android. Log sleep with friends, compare stats, and join challenges.";

const TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDeepLinkPath(pathname) {
  if (STATIC_PUBLIC_PATHS.has(pathname)) return true;
  if (pathname === '/login-callback' || pathname === '/health-callback') return true;
  return DEEP_LINK_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function truncate(value, max) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function pathSegments(pathname) {
  return pathname.split('/').filter(Boolean);
}

/** Fallback card copy from the URL shape (no network). */
function metaFromPath(pathname) {
  const segments = pathSegments(pathname);

  if (segments[0] === 'challenge' && segments[1] === 'join') {
    return {
      title: 'Join a sleep challenge on Slumber',
      description: 'Race friends on sleep goals in Slumber. Tap to join this challenge.',
      kind: 'challenge_join',
      token: segments[2] && TOKEN_RE.test(segments[2]) ? segments[2] : null,
    };
  }

  if (
    (segments[0] === 'challenge' || segments[0] === 'challenges')
    && segments[1]
    && segments[1] !== 'join'
  ) {
    return {
      title: 'Sleep challenge on Slumber',
      description: 'Open this challenge to see standings and join the race.',
      kind: 'challenge',
      id: UUID_RE.test(segments[1]) ? segments[1] : null,
    };
  }

  if (segments[0] === 'invite') {
    return {
      title: 'Add me on Slumber',
      description: 'Connect on Slumber — social sleep tracking for iOS and Android.',
      kind: 'friend',
      token: segments[1] && TOKEN_RE.test(segments[1]) ? segments[1] : null,
    };
  }

  if (segments[0] === 'club' && segments[2] === 'invite') {
    return {
      title: 'Join a sleep club on Slumber',
      description: 'Tap to join this club and sleep socially with the group.',
      kind: 'club',
      clubId: segments[1] && UUID_RE.test(segments[1]) ? segments[1] : null,
      token: segments[3] && TOKEN_RE.test(segments[3]) ? segments[3] : null,
    };
  }

  if (segments[0] === 'post') {
    return {
      title: 'Sleep post on Slumber',
      description: 'See how last night went — open this sleep log in Slumber.',
      kind: 'post',
      id: segments[1] && UUID_RE.test(segments[1]) ? segments[1] : null,
    };
  }

  if (segments[0] === 'profile') {
    return {
      title: 'Profile on Slumber',
      description: 'View this sleeper’s profile and recent nights on Slumber.',
      kind: 'profile',
      id: segments[1] && UUID_RE.test(segments[1]) ? segments[1] : null,
    };
  }

  if (segments[0] === 'recap') {
    return {
      title: 'Monthly sleep recap on Slumber',
      description: 'Open this monthly sleep recap in Slumber.',
      kind: 'recap',
    };
  }

  return {
    title: 'Join on Slumber',
    description: DEFAULT_DESCRIPTION,
    kind: 'generic',
  };
}

async function supabaseRpc(env, fnName, body) {
  const base = (env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_ANON_KEY || '';
  if (!base || !key) return null;

  try {
    const res = await fetch(`${base}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatGoal(minutes) {
  if (!minutes || typeof minutes !== 'number') return null;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h sleep goal`;
}

async function enrichMeta(env, pathname, baseMeta) {
  const meta = { ...baseMeta };

  if (baseMeta.kind === 'challenge_join' && baseMeta.token) {
    const row = await supabaseRpc(env, 'get_challenge_join_preview', {
      p_token: baseMeta.token,
    });
    if (row?.challengeId || row?.title) {
      const title = (row.title || '').trim() || 'Sleep challenge';
      const host =
        row.hostedBy === 'slumber'
          ? 'Slumber'
          : row.hostUsername
            ? `@${row.hostUsername}`
            : 'a friend';
      const goal = formatGoal(row.goalMinutes);
      const racers =
        typeof row.participantCount === 'number' && row.participantCount > 0
          ? `${row.participantCount} joined`
          : null;
      meta.title = truncate(`${title} · Join on Slumber`, 70);
      meta.description = truncate(
        [row.description?.trim(), `Hosted by ${host}`, goal, racers]
          .filter(Boolean)
          .join(' · ') || DEFAULT_DESCRIPTION,
        160,
      );
    }
    return meta;
  }

  if (baseMeta.kind === 'friend' && baseMeta.token) {
    const row = await supabaseRpc(env, 'get_friend_invite_preview', {
      p_token: baseMeta.token,
    });
    if (row?.valid && row.username) {
      meta.title = truncate(`Add @${row.username} on Slumber`, 70);
      meta.description = truncate(
        `@${row.username} invited you to Slumber — social sleep tracking for iOS and Android.`,
        160,
      );
    }
    return meta;
  }

  if (baseMeta.kind === 'club' && baseMeta.clubId && baseMeta.token) {
    const row = await supabaseRpc(env, 'get_club_invite_preview', {
      p_club_id: baseMeta.clubId,
      p_token: baseMeta.token,
    });
    if (row?.clubId || row?.name) {
      const name = (row.name || '').trim() || 'Sleep club';
      const emoji = (row.emoji || '').trim();
      const members =
        typeof row.memberCount === 'number' && row.memberCount > 0
          ? `${row.memberCount} members`
          : null;
      meta.title = truncate(`${emoji ? `${emoji} ` : ''}${name} · Join on Slumber`, 70);
      meta.description = truncate(
        [members, 'Tap to join this sleep club on Slumber'].filter(Boolean).join(' · '),
        160,
      );
    }
    return meta;
  }

  if (baseMeta.kind === 'post' && baseMeta.id) {
    const row = await supabaseRpc(env, 'get_post_link_preview', {
      p_post_id: baseMeta.id,
    });
    if (row?.valid || row?.username) {
      const who = row.username ? `@${row.username}` : 'a friend';
      const postTitle = (row.title || '').trim() || 'Sleep log';
      meta.title = truncate(`${postTitle} · ${who} on Slumber`, 70);
      const bits = [];
      if (row.sleepDate) bits.push(String(row.sleepDate));
      if (row.asleepMinutes) {
        const hours = Math.round((row.asleepMinutes / 60) * 10) / 10;
        bits.push(`${hours}h asleep`);
      }
      meta.description = truncate(
        bits.length ? bits.join(' · ') : `Open ${who}’s sleep log in Slumber.`,
        160,
      );
    }
    return meta;
  }

  if (baseMeta.kind === 'profile' && baseMeta.id) {
    const row = await supabaseRpc(env, 'get_profile_link_preview', {
      p_user_id: baseMeta.id,
    });
    if (row?.valid && row.username) {
      meta.title = truncate(`@${row.username} on Slumber`, 70);
      meta.description = truncate(
        `See @${row.username}’s sleep profile and recent nights on Slumber.`,
        160,
      );
    }
  }

  return meta;
}

class MetaRewriter {
  constructor(pageUrl, title, description) {
    this.pageUrl = pageUrl;
    this.title = title;
    this.description = description;
  }

  element(element) {
    const tag = element.tagName.toLowerCase();

    if (tag === 'title') {
      element.setInnerContent(this.title);
      return;
    }

    if (tag !== 'meta') return;

    const property = element.getAttribute('property');
    const name = element.getAttribute('name');

    if (property === 'og:title' || name === 'twitter:title') {
      element.setAttribute('content', this.title);
      return;
    }
    if (
      property === 'og:description'
      || name === 'twitter:description'
      || name === 'description'
    ) {
      element.setAttribute('content', this.description);
      return;
    }
    if (property === 'og:url') {
      element.setAttribute('content', this.pageUrl);
    }
  }
}

function rewriteSocialMeta(htmlResponse, pageUrl, title, description) {
  return new HTMLRewriter()
    .on('title', new MetaRewriter(pageUrl, title, description))
    .on('meta', new MetaRewriter(pageUrl, title, description))
    .transform(htmlResponse);
}

// Exported for local unit checks (node --experimental-vm-modules / wrangler).
export { metaFromPath, isDeepLinkPath, truncate };

export default {
  async fetch(request, env) {
    const response = await fetch(request);

    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    if (!isDeepLinkPath(url.pathname)) {
      return response;
    }

    // Prefer the SPA shell so browsers land on the real path (no hash redirect).
    // Fall back to 404.html which already carries deeplink OG defaults.
    const shellUrls = [
      new URL('/index.html', request.url),
      new URL('/404.html', request.url),
    ];

    let shell = null;
    for (const shellUrl of shellUrls) {
      const candidate = await fetch(shellUrl.toString(), {
        headers: { Accept: 'text/html' },
      });
      if (candidate.ok) {
        shell = candidate;
        break;
      }
    }

    if (!shell) {
      return response;
    }

    const meta = await enrichMeta(env, url.pathname, metaFromPath(url.pathname));
    const pageUrl = `${url.origin}${url.pathname}${url.search}`;
    const title = meta.title || 'Join on Slumber';
    const description = meta.description || DEFAULT_DESCRIPTION;

    const rewritten = rewriteSocialMeta(shell, pageUrl, title, description);
    const headers = new Headers(rewritten.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=0, must-revalidate');
    // Help some preview scrapers that key off this.
    headers.set('x-slumber-link-preview', '1');

    return new Response(rewritten.body, { status: 200, headers });
  },
};

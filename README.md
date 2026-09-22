# Slumber Web

Public web surfaces for Slumber — marketing pages, a signed-in app view (feed, profiles, challenges, kudos, comments), and the admin dashboard. Source lives in this folder on disk for convenience; it deploys from its own public GitHub repo (nested git in `website/`).

The main Slumber app repo only tracks this README; all other `website/*` files are gitignored here and live in the public repo.

## Public repo

| | |
|---|---|
| **Repo** | [`ryazlee/slumber-web`](https://github.com/ryazlee/slumber-web) |
| **Visibility** | Public |
| **Deploy** | GitHub Actions on push to `main` → GitHub Pages |
| **Live URL** | `https://useslumber.com` |
| **Legacy** | `https://ryazlee.github.io/slumber-web` (redirects to custom domain) |

```bash
cd website
git remote set-url origin git@github.com:ryazlee/slumber-web.git
npm install && npm run dev
```

## Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | No | Marketing home — store CTAs; signed-in users get a “See your feed” link |
| `/login` | Login | Web sign-in — email OTP, Google, magic link; redirects to `/feed` when signed in |
| `/login-callback` | — | Supabase auth return (magic link + Google OAuth) |
| `/feed` | Yes | Friends feed — kudos + comments; stage metrics on one line (dynamic sizing) |
| `/profile` | Yes | Your profile and recent posts (header avatar; not a tab) |
| `/social` | Yes | Redirects to Leaderboards (`/social/global`) |
| `/social/global` | Yes | Leaderboards (sleep rankings) — All-time (default) / Weekly (rolling last 7 days); Avg hours / Deep / REM / Core / Dream rate; place Δ vs board 7 days ago |
| `/social/clubs` | Yes | Clubs you’re in |
| `/social/friends` | Yes | Friends list + inbound requests |
| `/stats` | Yes | My Stats (30-day averages, charts, PRs) |
| `/stats/compare` | Yes | Friend compare table (wearable-only; bedtime/wake not rankable) |
| `/challenges` | Yes | Active and completed challenges |
| `/home` | No | Same marketing home as `/` (About / legacy links) |
| `/download` | No | Dedicated App Store + Google Play download page |
| `/contact` | No | Support email + developer contact |
| `*` (unknown) | No | Not-found page (Home / Download CTAs) |
| `/privacy` | No | Privacy policy (App Store / Play link) |
| `/terms` | No | Terms of service |
| `/delete-account` | No | Account deletion (Play Console account deletion URL) |
| `/delete-data` | No | Data deletion request (Play Console Data safety URL) |
| `/invite/:token` | Partial | Friend invite landing — `@username` preview; opens app to connect |
| `/post/:id` | Partial | Post landing + app handoff |
| `/profile/:userId` | Partial | Profile landing + app handoff |
| `/challenge/join/:token` | Partial | Open challenge join landing |
| `/club/:clubId/invite/:token` | Partial | Club invite landing |
| `/admin` | OTP / Google + admin role | Health snapshot, people insights, notify, campaigns, moderation |
| `/admin/campaigns` | Admin | In-app campaign prompts (popup + banner + pinned inbox row) |

**Partial auth:** deep-link landings show preview when logged out; signed-in users get full in-app views where applicable. Friend invite links are generated in the iOS app (**Profile → Share**); URL shape matches `buildFriendInviteUrl()` in the main repo.

## Local setup

```bash
cp .env.example .env.local
# VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — same publishable key as the app
# VITE_SITE_URL=https://useslumber.com  VITE_BASE_PATH=/  (production mirror)
```

**Production deploy:** `VITE_SITE_URL` and `VITE_BASE_PATH` are set in `.github/workflows/deploy.yml` (`https://useslumber.com`, `/`). Repo secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

**Supabase redirect URLs** must include `https://useslumber.com/login-callback` (and `slumber://login-callback` for the app).

**App mirror:** `EXPO_PUBLIC_WEB_BASE_URL=https://useslumber.com` (+ optional `EXPO_PUBLIC_WEB_LEGACY_BASE_URL`); new iOS build required for universal links on the custom domain. See repo root `.env.example` and `docs/feature-plans/completed/DEEP-LINKING.md`.

## Admin

Requires `developer` or `founder` (or any role with `is_admin` in `role_definitions`) in `profiles.user_roles`. See migration docs in the main Slumber repo.

## App config

```
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://useslumber.com/privacy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://useslumber.com/terms
```

Defaults derive from `EXPO_PUBLIC_WEB_BASE_URL` when omitted (`lib/legal.ts`).

## Link previews (iMessage, Messenger, etc.)

Crawlers do not run React. Open Graph tags are injected at build time into `index.html` and `404.html` via `lib/spaShellScripts.ts` (`og-image.png`, `apple-touch-icon.png`, etc. in `public/`).

**GitHub Pages quirk:** unknown SPA paths are served from `404.html` with **HTTP 404**. Google Play rejects privacy/deletion URLs that return 404. iMessage often skips rich previews on non-200 responses even when meta tags are present.

**Mitigations in this repo:**

1. **Build-time static shells** — `vite` copies `index.html` into `privacy/`, `terms/`, `delete-account/`, `delete-data/`, `home/`, `download/`, and `contact/` so those URLs return **HTTP 200** on GitHub Pages (required for Play Console).
2. **Cloudflare Pages** (optional) — deploy `dist/` with `public/_redirects` (`/* /index.html 200`). Previews use `index.html` meta + logo.
3. **Cloudflare Worker** (optional, keep GitHub Pages) — deploy `cloudflare/link-preview-worker.mjs` on `useslumber.com/*` to re-serve `404.html` with status **200** for deep-link + legal paths. See `cloudflare/README.md`.
4. **Verify after deploy** — `curl -sI https://useslumber.com/privacy` and `curl -sI https://useslumber.com/invite/TOKEN` should be `200`; `og-image.png` must return `200`.

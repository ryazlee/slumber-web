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
| `/` | Login | App entry — email OTP, Google, magic link; redirects to `/feed` when signed in |
| `/login-callback` | — | Supabase auth return (magic link + Google OAuth) |
| `/feed` | Yes | Friends feed — kudos + comments; stage metrics on one line (dynamic sizing) |
| `/profile` | Yes | Your profile and recent posts |
| `/stats` | Yes | My Stats (30-day averages, charts, PRs) |
| `/stats/compare` | Yes | Friend compare table (wearable-only; bedtime/wake not rankable) |
| `/challenges` | Yes | Active and completed challenges |
| `/home` | No | Marketing / product overview |
| `/privacy` | No | Privacy policy (App Store link) |
| `/terms` | No | Terms of service |
| `/invite/:token` | Partial | Friend invite landing — `@username` preview; opens app to connect |
| `/post/:id` | Partial | Post landing + app handoff |
| `/profile/:userId` | Partial | Profile landing + app handoff |
| `/challenge/join/:token` | Partial | Open challenge join landing |
| `/club/:clubId/invite/:token` | Partial | Club invite landing |
| `/admin` | OTP / Google + admin role | Moderation dashboard |

**Partial auth:** deep-link landings show preview when logged out; signed-in users get full in-app views where applicable. Friend invite links are generated in the iOS app (**People → Share invite link**); URL shape matches `buildFriendInviteUrl()` in the main repo.

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

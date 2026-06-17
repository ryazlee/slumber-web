# Slumber Web

Public web surfaces for Slumber — marketing pages, a signed-in app view (feed, profiles, challenges, kudos, comments), and the admin dashboard. Source lives in this folder on disk for convenience; it deploys from its own public GitHub repo (nested git in `website/`).

The main Slumber app repo only tracks this README; all other `website/*` files are gitignored here and live in the public repo.

## Public repo

| | |
|---|---|
| **Repo name** | `slumber-web` (rename from `slumber-home` when ready) |
| **Visibility** | Public |
| **Deploy target** | GitHub Pages (GitHub Actions on push to `main`) |
| **Live URL** | `https://<your-user>.github.io/slumber-web/` |

```bash
cd website
git remote set-url origin git@github.com:<your-user>/slumber-web.git
npm install && npm run dev
```

## Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Login | App entry — email OTP, redirects to `/feed` when signed in |
| `/feed` | Yes | Friends feed — kudos + comments |
| `/profile` | Yes | Your profile and recent posts |
| `/challenges` | Yes | Active and completed challenges |
| `/home` | No | Marketing / product overview |
| `/privacy` | No | Privacy policy (App Store link) |
| `/terms` | No | Terms of service |
| `/admin` | OTP + admin role | Moderation dashboard |

## Local setup

```bash
cp .env.example .env.local
# VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — same publishable key as the app
```

For GitHub Pages, add repo secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, and `VITE_BASE_PATH` (e.g. `/slumber-web`).

**Changing the public domain later:** update `VITE_SITE_URL` + `VITE_BASE_PATH` on the website, and `EXPO_PUBLIC_WEB_BASE_URL` in the app (see repo root `.env.example`). Rebuild/redeploy both; the app needs a new iOS build for `associatedDomains`.

## Admin

Requires `developer` or `founder` (or any role with `is_admin` in `role_definitions`) in `profiles.user_roles`. See migration docs in the main Slumber repo.

## App config

```
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://<your-user>.github.io/slumber-web/privacy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://<your-user>.github.io/slumber-web/terms
```

Until the GitHub repo is renamed from `slumber-home`, keep existing URLs or add redirects.

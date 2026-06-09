# Website

This folder holds the **Slumber marketing site** — home page, privacy policy, and terms of service. It is **not** part of the app codebase and is **not** tracked in this repo (except this README).

## Why it exists here

The main Slumber repo is private. GitHub Pages needs a **public** repo. The site source lives in this directory on disk for convenience, but it deploys from its own remote.

## Public repo

Initialize git here and push to a separate public repository, e.g.:

| | |
|---|---|
| **Suggested name** | `slumber-home` |
| **Visibility** | Public |
| **Deploy target** | GitHub Pages (via GitHub Actions on push to `main`) |
| **Live URL** | `https://<your-user>.github.io/slumber-home/` (or a custom domain) |

```bash
cd website
git init
git remote add origin git@github.com:<your-user>/slumber-home.git
# first push: git add . && git commit && git push -u origin main
```

After the first push, enable **Settings → Pages → Source: GitHub Actions** on that repo.

## What's in the site

- `/` — product overview
- `/privacy` — privacy policy (linked from the app via `EXPO_PUBLIC_PRIVACY_POLICY_URL`)
- `/terms` — terms of service
- `/admin` — moderation dashboard (not linked from public nav; Supabase OTP login)

Built with React + Vite. Run `npm install && npm run dev` from this folder for local preview.

## Admin page

1. Apply migrations `043`–`048` on production Supabase (`043` comment reports, `044` user_roles + moderation RPCs, `045` dashboard + tags, `046` assign roles to users, `047` `role_definitions` table, `048` role definition admin RPCs).
2. Grant yourself admin roles via `user_roles` (order matters for app avatar ring only, not admin access):

```sql
-- Add a role without removing existing ones
UPDATE public.profiles
SET user_roles = array_cat(user_roles, ARRAY['developer'])
WHERE username = 'your_username'
  AND NOT ('developer' = ANY(user_roles));

-- Or set roles explicitly (first = avatar ring)
UPDATE public.profiles
SET user_roles = ARRAY['developer', 'founder']
WHERE username = 'your_username';
```

3. Copy `.env.example` → `.env.local` and fill in Supabase URL + anon key (same publishable key as the app).
4. For GitHub Pages, add repo secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Visit `https://<your-user>.github.io/slumber-home/admin` and sign in with email OTP.

Accounts need a role with `is_admin = true` in `role_definitions` (seeded: `developer`, `founder`) assigned in `profiles.user_roles`. The **Roles** tab edits definitions; the **Users** tab assigns them.

## App config

Once deployed, point the app at the hosted URLs:

```
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://<your-user>.github.io/slumber-home/privacy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://<your-user>.github.io/slumber-home/terms
```

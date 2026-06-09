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

Built with React + Vite. Run `npm install && npm run dev` from this folder for local preview.

## App config

Once deployed, point the app at the hosted URLs:

```
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://<your-user>.github.io/slumber-home/privacy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://<your-user>.github.io/slumber-home/terms
```

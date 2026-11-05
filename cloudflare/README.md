# Link preview worker (iMessage / Messenger / Slack)

## Prefer `/open/` for new shares

New invite/join links from the app use a static shell that already returns **HTTP 200** on GitHub Pages:

`https://useslumber.com/open/?challenge=TOKEN`

That path needs no Worker. This Worker is for **legacy path URLs** still circulating in old texts:

`https://useslumber.com/challenge/join/TOKEN`

## Why legacy path previews fail

`useslumber.com` is on **GitHub Pages**. Share URLs like

`https://useslumber.com/challenge/join/833378724bc5?ref=…`

correctly include Open Graph tags (`og:image` → `/og-image.png`) in `404.html`, but GitHub still responds with **HTTP 404**. iMessage and Messenger often **skip the rich preview** when the status is not 200.

```bash
curl -sI "https://useslumber.com/challenge/join/TOKEN" | head -1
# HTTP/2 404   ← this is the bug

curl -sI "https://useslumber.com/og-image.png" | head -1
# HTTP/2 200   ← image itself is fine
```

## Fix

Put **Cloudflare** in front of GitHub Pages (free) and run `link-preview-worker.mjs` on `useslumber.com/*`. The worker:

1. Leaves normal 200 responses alone (home, `/privacy/`, `og-image.png`, assets).
2. On deep-link 404s, re-serves `index.html` with **status 200**.
3. Rewrites `og:title` / description / `og:url` for the shared path.
4. Optionally loads the real challenge / friend / club / post title from Supabase.

GitHub Pages stays the origin. Universal links and the SPA keep working.

## One-time setup (~10 minutes)

### 1. Add the domain to Cloudflare

1. Create a free Cloudflare account.
2. **Add site** → `useslumber.com` → Free plan.
3. Cloudflare shows two nameservers. In Namecheap (or wherever DNS is):
   - Domain → Nameservers → **Custom** → paste Cloudflare’s nameservers.
4. Wait until the zone status is **Active**.

### 2. Point DNS at GitHub Pages (proxied)

In Cloudflare DNS, mirror what GitHub Pages expects (orange-cloud **Proxied**):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `185.199.108.153` | Proxied |
| A | `@` | `185.199.109.153` | Proxied |
| A | `@` | `185.199.110.153` | Proxied |
| A | `@` | `185.199.111.153` | Proxied |
| CNAME | `www` | `ryazlee.github.io` | Proxied |

SSL/TLS mode: **Full** (not Full strict, unless you terminate differently).

Keep the GitHub Pages custom-domain + `CNAME` file as they are today.

### 3. Deploy the worker

```bash
cd cloudflare
npx wrangler login
npx wrangler deploy

# Optional but recommended — richer titles (“Join Night Owls · Slumber”)
npx wrangler secret put SUPABASE_URL        # same as VITE_SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY   # same as VITE_SUPABASE_ANON_KEY
```

Then in Cloudflare → Workers → `slumber-link-preview` → **Triggers** → Add route:

`useslumber.com/*`

(or uncomment `routes` in `wrangler.toml` and redeploy).

### 4. Verify

```bash
curl -sI "https://useslumber.com/challenge/join/833378724bc5" | head -1
# HTTP/2 200

curl -s "https://useslumber.com/challenge/join/833378724bc5" \
  | grep -E 'og:title|og:image|og:url' | head -5
```

Paste the link in iMessage — you should see the Slumber card (`og-image.png`) and a join title.

> Apple and Meta cache previews. After deploy, send a **fresh URL** (or append `&v=2`) if an old bare link stays stuck.

## CI (optional)

Workflow `.github/workflows/deploy-link-preview-worker.yml` deploys on changes under `cloudflare/` when these GitHub secrets exist:

- `CLOUDFLARE_API_TOKEN` — Worker edit permission
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — synced to Worker secrets

## Alternative: Cloudflare Pages

Deploy `dist/` to Cloudflare Pages instead of GitHub Pages and keep `public/_redirects` (`/* /index.html 200`). Then you do not need this Worker for status 200 — but you still want something like it (or Pages Functions) if you want per-link titles from Supabase. On Pages, **omit** top-level `404.html` so SPA fallback stays on.

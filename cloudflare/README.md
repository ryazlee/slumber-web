# Link preview worker (GitHub Pages + custom domain)

iMessage and Messenger often ignore Open Graph tags when the URL returns **HTTP 404**. GitHub Pages serves `404.html` for `/invite/*`, `/post/*`, etc., but keeps status 404.

## Deploy

1. Cloudflare dashboard → **Workers & Pages** → Create worker.
2. Paste `link-preview-worker.mjs` (or connect this repo and set entry).
3. **Triggers** → Add route: `useslumber.com/*` (or your zone).
4. Ensure DNS for `useslumber.com` is proxied through Cloudflare (orange cloud).

The worker passes through normal 200 responses (assets, `index.html`, `og-image.png`). For 404 responses on known deep-link prefixes, it fetches `/404.html` and returns the same body with **status 200**.

## Alternative

Migrate hosting to **Cloudflare Pages** and use `public/_redirects` (`/* /index.html 200`) — no worker required.

## Test

```bash
curl -sI https://useslumber.com/invite/YOUR_TOKEN | head -1
# HTTP/2 200

curl -sI https://useslumber.com/og-image.png | head -1
# HTTP/2 200
```

Paste a link in iMessage — you should see the Slumber card (`og-image.png`) and “Join on Slumber” title.

# Navratri Banner Maker + Discord (consent-based)

The site creates a greeting banner in the visitor's browser. Discord delivery sends only that PNG after the visitor checks consent and taps Send. Camera, microphone, and location are optional and are never uploaded by this site.

## Website
GitHub Pages URL: https://yogeshtiwari29186-hash.github.io/descord-/

## Deploy the Discord Worker
The Worker code and Wrangler configuration are in `worker.js` and `wrangler.toml`. A GitHub Actions workflow is prepared at **Actions → Deploy Discord Worker**.

1. In Cloudflare, create an API token with permission to edit Workers and obtain your Cloudflare Account ID.
2. In this GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `DISCORD_WEBHOOK_URL` — use a newly regenerated Discord webhook. Do not reuse a webhook that was previously shared in chat.
3. Run **Actions → Deploy Discord Worker → Run workflow**. The workflow deploys the Worker and stores the webhook as a Worker secret; it does not put the webhook in public website code.
4. Copy the deployed `workers.dev` URL from the workflow log or Cloudflare dashboard. The website's send handler must use that URL followed by `/api/send` instead of the placeholder in `index.html`. The exact workers.dev hostname depends on your Cloudflare account, so it cannot be safely guessed in advance.
5. Wait for GitHub Pages to publish the updated website and test with the consent checkbox.

Worker environment:
- `ALLOWED_ORIGIN` is set in `wrangler.toml` to `https://yogeshtiwari29186-hash.github.io`.
- `DISCORD_WEBHOOK_URL` is a secret and should never be committed to the repository.
- Only PNG banners up to 8 MB are accepted; no permanent file storage or database is used.

## Important
A Discord webhook URL is a private destination credential, not the browser endpoint. Never put it directly into `index.html`; anyone viewing the public source could steal it. Browser permission popups also require the visitor to tap the relevant permission button.

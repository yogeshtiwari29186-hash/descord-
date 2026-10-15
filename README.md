# Selfie Camera + Discord

Mobile-first selfie camera frontend with a consent-based Discord upload endpoint.

## Deploy the website and backend (no Cloudflare API or Account ID)

This repository now includes a Vercel serverless endpoint at `api/send.js`. To make camera upload work, deploy the repository on Vercel so the frontend and `/api/send` endpoint run on the same domain.

1. Open https://vercel.com/new and import `yogeshtiwari29186-hash/descord-` from GitHub.
2. Deploy the project. After the first deployment, copy the production domain, for example `https://your-project.vercel.app`.
3. In Vercel, open **Project → Settings → Environment Variables** and add:
   - `DISCORD_WEBHOOK_URL` = a newly created Discord webhook URL (secret; never put it in frontend code).
   - `ALLOWED_ORIGIN` = the exact production origin, e.g. `https://your-project.vercel.app` (no trailing slash).
4. Redeploy after adding the variables.
5. Open the Vercel production URL, allow the camera, take a photo, check consent, and tap **Send photo to Discord**.

The frontend detects a `.vercel.app` domain and sends to the same-origin `/api/send` route. The GitHub Pages URL below is only the static camera frontend; Discord upload will show a backend-not-configured message there until a serverless backend is deployed and its endpoint is configured.

## GitHub Pages frontend
https://yogeshtiwari29186-hash.github.io/descord-/

## Privacy and security
- The camera starts only after the visitor taps the start button and accepts the browser permission prompt.
- A photo is captured only when the visitor taps **Take photo**.
- The photo is sent only after the visitor checks consent and taps **Send photo to Discord**.
- The server accepts only one JPEG/PNG photo up to 8 MB and forwards it to the configured Discord webhook without permanent file storage.
- The server checks the configured website origin and keeps the webhook in a server-side environment variable.
- Do not commit or share a Discord webhook. If an old webhook was pasted into chat or a public file, revoke it and create a new one.

Camera access requires HTTPS and the visitor's explicit browser permission.

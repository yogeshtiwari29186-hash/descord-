# Navratri Banner Maker + Discord (consent-based)

This repository starts as an empty repository. The site creates a Navratri greeting banner in the visitor's browser and lets them download it as PNG. It does not automatically access camera, microphone, or location. Discord delivery is optional and only sends the banner after the user checks consent and clicks Send.

## Publish the website with GitHub Pages
1. Open **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch `main`, folder `/(root)`, then Save.
4. Wait for GitHub Pages to publish. The project URL should be `https://yogeshtiwari29186-hash.github.io/descord-/`. GitHub says publication can take several minutes: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Enable Discord delivery safely
**Do not paste the webhook token into index.html or any public repository file.** The webhook URL previously shared in chat should be regenerated in Discord before use.

1. Create a Cloudflare Worker and deploy `worker.js`.
2. In Worker settings, add secret `DISCORD_WEBHOOK_URL` with your newly regenerated webhook URL.
3. Add variable `ALLOWED_ORIGIN` set to `https://yogeshtiwari29186-hash.github.io` (no trailing slash).
4. In `index.html`, replace `https://YOUR-WORKER.workers.dev/api/send` with your actual Worker URL plus `/api/send`.
5. Commit the update and wait for GitHub Pages to redeploy.

The Worker accepts only PNG images up to 8 MB, checks the website Origin, and sends the file to Discord. No separate permanent file storage or database is used by this starter. The site does not capture private data in the background. Discord will retain any banner delivered to its channel according to that server's settings.

## Test
- Open the published site, edit the text, click **PNG डाउनलोड करें**.
- After the Worker is configured, check consent and click **बैनर Discord पर भेजें**.
- If sending fails, inspect the Worker logs and confirm the secret and allowed origin are correct.

# Selfie Camera Frontend

A mobile-first camera website hosted from this GitHub repository.

## Website
GitHub Pages: https://yogeshtiwari29186-hash.github.io/descord-/

## Current features
- Requests camera permission only after the visitor taps **Start front camera**.
- Starts with the front/selfie camera where supported.
- Lets the visitor switch between front and rear cameras.
- Captures a photo only when the visitor taps **Take photo**.
- Shows a preview and offers retake/stop controls.
- Requires explicit consent before the Discord send action.
- Stops the camera stream when the visitor stops it or leaves the page.
- Does not request microphone or location permission and does not silently upload photos.

## Discord upload status
The frontend is committed, but Discord delivery is **not configured yet**. The send handler intentionally has an empty `DISCORD_UPLOAD_ENDPOINT` setting. A private backend is required to keep the Discord webhook secret out of public browser code.

Cloudflare API and Account ID are not required for the camera frontend. To enable Discord delivery without Cloudflare, deploy a serverless backend on another host (for example, import this repository into a host that supports serverless functions), configure `DISCORD_WEBHOOK_URL` as a server-side secret, and then set `DISCORD_UPLOAD_ENDPOINT` in `index.html` to that backend's public upload URL. The backend must validate the website origin, accept only image files with a size limit, and forward only a photo the visitor explicitly chose to send.

**Never paste a Discord webhook into `index.html` or any public repository file.** If a webhook was previously shared publicly or in chat, revoke it and create a new one.

## Camera requirements
Camera access works on HTTPS and requires the visitor's browser permission. Browsers do not allow websites to open a camera secretly or without user interaction.

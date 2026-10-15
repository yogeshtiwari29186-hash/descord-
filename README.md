# descord- — GitHub Pages + Discord Bot

The website stays on GitHub Pages. **No Vercel is used.** The mobile-first camera page starts only when the visitor taps Start camera and grants browser permission. A photo is captured only when they tap Take photo and sent only after they preview it, check consent, and tap Send.

## Website
https://yogeshtiwari29186-hash.github.io/descord-/

## Architecture
- GitHub Pages serves the public static camera UI.
- `bot-server/` is a Node.js API + Discord bot. It validates the photo, applies an upload rate limit, and posts the photo to one configured Discord channel.
- The Discord bot token is stored only in private hosting environment variables, never in frontend JavaScript or GitHub files.

## Deploy the Discord bot server (Render, not Vercel)

1. In Discord Developer Portal, create an application and add a **Bot**. Copy its bot token privately. If a token was exposed, reset it.
2. Invite the bot to your Discord server with only **View Channel**, **Send Messages**, and **Attach Files** permissions for the target channel. Do not grant Administrator.
3. Enable Developer Mode in Discord and copy the target channel ID.
4. In Render, create a **Blueprint** from this GitHub repository so it reads `render.yaml`. If Blueprint is unavailable, create a Web Service manually with root directory `bot-server`, build command `npm install`, and start command `npm start`.
5. In the Render service's private Environment settings, set:
   - `DISCORD_BOT_TOKEN` = your private bot token
   - `DISCORD_CHANNEL_ID` = the target Discord channel ID
   - `ALLOWED_ORIGIN` = `https://yogeshtiwari29186-hash.github.io`
6. Deploy. Visit `https://YOUR-SERVICE.onrender.com/health`. A connected bot should return `{"ok":true,"service":"descord-discord-bot"}`.
7. In `index.html`, find the line `const DISCORD_UPLOAD_ENDPOINT = "";` and replace the empty string with your Render URL plus `/api/send`, for example `https://YOUR-SERVICE.onrender.com/api/send`. Commit the change. Do not add a trailing slash.
8. Wait for GitHub Pages to update, then test with a photo you own: Start camera → Take photo → check consent → Send photo. Confirm it appears in the configured Discord channel.

## Privacy and safety
- The site asks for browser camera permission; it does not request microphone or location.
- No photo is uploaded until the visitor captures it, checks consent, and presses Send.
- The API accepts JPEG/PNG images up to 8 MB and limits each IP to 8 upload attempts per 15 minutes.
- Origin/CORS checks are browser protections, not authentication. Add CAPTCHA or stronger abuse controls before sharing widely.
- The server forwards the photo to Discord and does not intentionally save it to a permanent file store. Hosting providers may retain operational logs.
- Never put a Discord bot token or webhook URL in `index.html` or any public repository file.

Direct Discord upload stays disabled until the bot service is deployed and `DISCORD_UPLOAD_ENDPOINT` is configured.

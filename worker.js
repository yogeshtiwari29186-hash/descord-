/**
 * Cloudflare Worker: send only a user-created banner to Discord after explicit consent.
 * Configure secrets/settings in the Worker dashboard:
 *   DISCORD_WEBHOOK_URL (secret)
 *   ALLOWED_ORIGIN (e.g. https://yogeshtiwari29186-hash.github.io)
 */
const MAX_BYTES = 8 * 1024 * 1024;
function cors(origin, allowed) {
  return {
    "Access-Control-Allow-Origin": origin === allowed ? allowed : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env.ALLOWED_ORIGIN || "");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (origin !== env.ALLOWED_ORIGIN) return new Response("Origin not allowed", { status: 403, headers });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers });
    if (!env.DISCORD_WEBHOOK_URL) return new Response("Webhook is not configured", { status: 503, headers });
    const type = request.headers.get("Content-Type") || "";
    if (!type.toLowerCase().includes("multipart/form-data")) return new Response("Expected multipart form", { status: 415, headers });
    try {
      const form = await request.formData();
      const file = form.get("banner");
      if (!(file instanceof File)) return new Response("Banner file required", { status: 400, headers });
      if (file.type !== "image/png") return new Response("Only PNG banners are accepted", { status: 415, headers });
      if (file.size < 1 || file.size > MAX_BYTES) return new Response("Banner must be under 8 MB", { status: 413, headers });
      const discord = new FormData();
      discord.append("file", file, "shubh-navratri-banner.png");
      discord.append("payload_json", JSON.stringify({ content: "A user explicitly chose to send their Navratri banner from the banner maker." }));
      const result = await fetch(env.DISCORD_WEBHOOK_URL, { method: "POST", body: discord });
      if (!result.ok) return new Response("Discord delivery failed", { status: 502, headers });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    } catch {
      return new Response("Invalid upload", { status: 400, headers });
    }
  }
};
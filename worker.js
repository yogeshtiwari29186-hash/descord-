/**
 * Cloudflare Worker: forwards only a user-selected banner or a photo explicitly
 * captured and submitted by the visitor. No files are stored by this Worker.
 * Required: DISCORD_WEBHOOK_URL secret and ALLOWED_ORIGIN variable.
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
      const banner = form.get("banner");
      const photo = form.get("photo");
      const file = photo instanceof File ? photo : banner;
      if (!(file instanceof File)) return new Response("Banner or photo file required", { status: 400, headers });
      const isPhoto = photo instanceof File;
      const allowedType = isPhoto ? ["image/jpeg", "image/png"].includes(file.type) : file.type === "image/png";
      if (!allowedType) return new Response(isPhoto ? "Only JPEG or PNG photos are accepted" : "Only PNG banners are accepted", { status: 415, headers });
      if (file.size < 1 || file.size > MAX_BYTES) return new Response("Image must be under 8 MB", { status: 413, headers });
      const discord = new FormData();
      discord.append("file", file, isPhoto ? (file.type === "image/png" ? "camera-photo.png" : "camera-photo.jpg") : "shubh-navratri-banner.png");
      discord.append("payload_json", JSON.stringify({ content: isPhoto ? "A visitor explicitly captured and consented to send this photo." : "A user explicitly chose to send their Navratri banner from the banner maker." }));
      const result = await fetch(env.DISCORD_WEBHOOK_URL, { method: "POST", body: discord });
      if (!result.ok) return new Response("Discord delivery failed", { status: 502, headers });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    } catch {
      return new Response("Invalid upload", { status: 400, headers });
    }
  }
};
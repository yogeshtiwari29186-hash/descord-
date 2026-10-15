const Busboy = require("busboy");

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "";
  const origin = req.headers.origin || "";

  if (origin && origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!allowedOrigin || origin !== allowedOrigin) return res.status(403).json({ error: "Origin not allowed" });

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return res.status(503).json({ error: "Discord webhook is not configured" });

  let parsedWebhook;
  try {
    parsedWebhook = new URL(webhook);
    if (!["discord.com", "discordapp.com"].includes(parsedWebhook.hostname) ||
        !parsedWebhook.pathname.startsWith("/api/webhooks/")) {
      return res.status(500).json({ error: "Invalid Discord webhook configuration" });
    }
  } catch {
    return res.status(500).json({ error: "Invalid Discord webhook configuration" });
  }

  if (!(req.headers["content-type"] || "").toLowerCase().includes("multipart/form-data")) {
    return res.status(415).json({ error: "Expected multipart form data" });
  }

  let busboy;
  try {
    busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_FILE_BYTES } });
  } catch {
    return res.status(400).json({ error: "Invalid multipart form" });
  }

  let fileBuffer = null;
  let fileType = "";
  let fileName = "selfie.jpg";
  let tooLarge = false;
  let invalidType = false;
  let fileCount = 0;

  const parsed = new Promise((resolve, reject) => {
    busboy.on("file", (fieldName, file, info) => {
      fileCount += 1;
      if (fieldName !== "photo" || fileCount > 1) {
        file.resume();
        invalidType = true;
        return;
      }
      fileType = info.mimeType || "";
      fileName = fileType === "image/png" ? "selfie.png" : "selfie.jpg";
      const chunks = [];
      let size = 0;
      file.on("data", chunk => {
        size += chunk.length;
        if (size <= MAX_FILE_BYTES) chunks.push(chunk);
      });
      file.on("limit", () => { tooLarge = true; });
      file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
    });
    busboy.on("error", reject);
    busboy.on("finish", resolve);
  });

  req.pipe(busboy);
  try { await parsed; } catch { return res.status(400).json({ error: "Invalid upload" }); }

  if (tooLarge) return res.status(413).json({ error: "Photo must be under 8 MB" });
  if (invalidType || !fileBuffer || fileBuffer.length === 0) {
    return res.status(400).json({ error: "Send one photo using the photo field" });
  }
  if (!ALLOWED_TYPES.has(fileType)) return res.status(415).json({ error: "Only JPEG or PNG photos are accepted" });

  try {
    const body = new FormData();
    body.append("file", new Blob([fileBuffer], { type: fileType }), fileName);
    body.append("payload_json", JSON.stringify({
      content: "A visitor explicitly captured and consented to send this selfie."
    }));
    const response = await fetch(webhook, { method: "POST", body });
    if (!response.ok) return res.status(502).json({ error: "Discord delivery failed" });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "Could not deliver photo to Discord" });
  }
};

module.exports.config = { api: { bodyParser: false } };

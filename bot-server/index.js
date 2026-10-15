const express = require("express");
const cors = require("cors");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = (process.env.ALLOWED_ORIGIN || "").replace(/\/$/, "");
const channelId = process.env.DISCORD_CHANNEL_ID || "";
const botToken = process.env.DISCORD_BOT_TOKEN || "";
const MAX_BYTES = 8 * 1024 * 1024;

if (!allowedOrigin || !channelId || !botToken) {
  console.error("Missing required env vars: ALLOWED_ORIGIN, DISCORD_CHANNEL_ID, DISCORD_BOT_TOKEN");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let botReady = false;

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin.replace(/\/$/, "") !== allowedOrigin) return callback(new Error("Origin not allowed"));
    return callback(null, true);
  },
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.get("/health", (_req, res) => {
  res.status(botReady ? 200 : 503).json({ ok: botReady, service: "descord-discord-bot" });
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many uploads. Try again later." }
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 0 },
  fileFilter(_req, file, callback) {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) return callback(new Error("Only JPEG or PNG images are accepted"));
    callback(null, true);
  }
});

app.post("/api/send", uploadLimiter, upload.single("photo"), async (req, res) => {
  if (!botReady) return res.status(503).json({ error: "Discord bot is not ready" });
  if (!req.file) return res.status(400).json({ error: "Choose a JPEG or PNG photo" });

  const b = req.file.buffer;
  const isJpeg = b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const isPng = b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (!(isJpeg || isPng)) return res.status(415).json({ error: "File content is not a valid JPEG or PNG image" });

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !channel.send) {
      return res.status(500).json({ error: "Configured Discord channel is not a text channel" });
    }
    const extension = isPng ? "png" : "jpg";
    const attachment = new AttachmentBuilder(b, { name: `visitor-selfie.${extension}` });
    await channel.send({
      content: "A visitor explicitly captured this photo, reviewed the preview, checked consent, and tapped Send on the website.",
      files: [attachment],
      allowedMentions: { parse: [] }
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Discord delivery failed:", error.message);
    return res.status(502).json({ error: "Discord could not receive the photo. Check bot channel permissions." });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Photo must be smaller than 8 MB" });
  }
  if (error.message === "Origin not allowed") return res.status(403).json({ error: "Website origin not allowed" });
  if (error.message && error.message.includes("image")) return res.status(415).json({ error: error.message });
  console.error("Request failed:", error.message);
  return res.status(400).json({ error: "Invalid upload request" });
});

client.once("ready", () => {
  botReady = true;
  console.log(`Discord bot ready as ${client.user.tag}`);
});
client.on("error", error => console.error("Discord client error:", error.message));

client.login(botToken).catch(error => {
  console.error("Discord bot login failed:", error.message);
  process.exit(1);
});

app.listen(PORT, () => console.log(`Upload API listening on port ${PORT}`));

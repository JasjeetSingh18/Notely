// my-app/server/app.mjs
import "dotenv/config";
import express from "express";
import mongoose, { isValidObjectId } from "mongoose";
import cors from "cors";
import path from "path";
// server/firebaseAdmin.mjs
import {
  initializeApp,
  cert,
  applicationDefault,
  getApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getUid } from "./firebase.mjs";
import { enhancePrompt, notePrompt, sendMessageToGemini } from "./gemini.mjs";

if (!getApps().length) {
  initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      : applicationDefault(),
  });
}

export const adminAuth = getAuth();

const app = express();
const __dirname = path.resolve();

app.use(express.json({ limit: "2mb" }));

// CORS: allow your deployed frontend (or "*" during early testing)
// CORS configuration: allow origins from ALLOW_ORIGIN (comma separated) or allow all in testing
const allowedOriginsRaw = process.env.ALLOW_ORIGIN;
let allowedOrigins = allowedOriginsRaw
  ? allowedOriginsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  : [];
// If the env var is missing or empty (for example an empty string), default to allow-all
if (!allowedOrigins || allowedOrigins.length === 0) {
  allowedOrigins = ["*"];
}
if (process.env.NODE_ENV !== "production") {
  console.log("CORS allowedOrigins:", allowedOrigins);
}
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    allowedOrigins.includes("*") ||
    (origin && allowedOrigins.includes(origin))
  ) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      allowedOrigins.includes("*") ? "*" : origin
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,x-owner"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  // Handle preflight
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const LOCAL_FALLBACK = "mongodb://127.0.0.1:27017/notely";
const MONGODB_URI = process.env.MONGODB_URI || LOCAL_FALLBACK;

// Connect (Atlas works without extra options if you include the db name in the URI)
await mongoose.connect(MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(
    "Mongo connected:",
    mongoose.connection.host,
    "db:",
    mongoose.connection.name
  );
});
mongoose.connection.on("error", (e) => {
  console.error("Mongo error:", e?.message || e);
});

// ---------- Schema & Model ----------
const docSchema = new mongoose.Schema(
  {
    owner: { type: String, index: true, default: "anon" },
    title: { type: String, default: "Untitled doc" },
    contentHtml: { type: String, default: "<h1>Untitled doc</h1><p></p>" },
    chat: [
      {
        role: String,
        content: String,
      },
    ],
  },
  { timestamps: true }
);
docSchema.index({ owner: 1, updatedAt: -1 });
const Doc = mongoose.model("Doc", docSchema);

const toClient = (d) => ({
  id: d._id.toString(),
  title: d.title,
  contentHtml: d.contentHtml,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

function getOwner(req) {
  return (
    (req.headers["x-owner"] && String(req.headers["x-owner"]).trim()) || "anon"
  );
}

// ---------- Routes ----------
app.get("/api", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get("/api/docs", async (req, res) => {
  const owner = getOwner(req);
  const docs = await Doc.find({ owner }).sort({ updatedAt: -1 }).lean();
  res.json(docs.map(toClient));
});

app.post("/api/docs", async (req, res) => {
  const owner = getOwner(req);
  const {
    title = "Untitled doc",
    contentHtml = "<h1>Untitled doc</h1><p></p>",
  } = req.body || {};
  const doc = await Doc.create({ owner, title, contentHtml });
  res.status(201).json(toClient(doc));
});

app.get("/api/docs/:id", async (req, res) => {
  const owner = getOwner(req);
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ error: "invalid id" });
  const doc = await Doc.findOne({ _id: id, owner }).lean();
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(toClient(doc));
});

app.put("/api/docs/:id", async (req, res) => {
  const owner = getOwner(req);
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ error: "invalid id" });

  const { title, contentHtml } = req.body || {};
  const update = {
    ...(title != null ? { title } : {}),
    ...(contentHtml != null ? { contentHtml } : {}),
  };

  const doc = await Doc.findOneAndUpdate({ _id: id, owner }, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(toClient(doc));
});

app.delete("/api/docs/:id", async (req, res) => {
  const owner = getOwner(req);
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ error: "invalid id" });
  await Doc.deleteOne({ _id: id, owner });
  res.json({ ok: true });
});

app.post("/api/ai/inline", async (req, res) => {
  try {
    const { prompt: highlight, mode, contextHtml: notes } = req.body ?? {};

    if (!highlight) {
      return res.status(400).json({ error: "Highlight is required" });
    }

    // Call Gemini with the highlight, full notes, and the selected mode
    const answer = await notePrompt(highlight, notes, mode);

    res.json({ answer });
  } catch (err) {
    console.error("Inline AI error:", err);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

app.post("/api/ai/enhance", async (req, res) => {
  try {
    const { prompt: highlight, contextHtml: notes } = req.body ?? {};

    if (!highlight) {
      return res.status(400).json({ error: "Highlight is required" });
    }

    // Call Gemini with the highlight, full notes, and the selected mode
    const answer = await enhancePrompt(highlight, notes, "enhance");

    res.json({ answer });
  } catch (err) {
    console.error("Inline AI error:", err);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

app.get("/api/docs/:id/chat", async (req, res) => {
  const doc = await Doc.findById(req.params.id);
  res.json({ messages: doc.chat || [] });
});

app.put("/api/docs/:id/chat", async (req, res) => {
  const { messages } = req.body;
  const doc = await Doc.findByIdAndUpdate(
    req.params.id,
    { chat: messages },
    { new: true }
  );
  res.json({ messages: doc.chat });
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, contextHtml, messages } = req.body ?? {};

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const answer = await sendMessageToGemini(
      prompt,
      contextHtml,
      messages ?? []
    );

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// ---------- Serve Vite Frontend ----------
const FRONTEND_DIST = path.join(__dirname, "../dist"); // adjust if your dist folder is elsewhere
app.use(express.static(FRONTEND_DIST));

// SPA routing: send index.html for all non-API requests
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

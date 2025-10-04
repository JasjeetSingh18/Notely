// my-app/server/app.mjs
import 'dotenv/config';
import express from "express";
import mongoose, { isValidObjectId } from 'mongoose';

const app = express();

app.use(express.json({ limit: '2mb' }));


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notely';
await mongoose.connect(MONGODB_URI);

// ---------- Schema & Model ----------
const docSchema = new mongoose.Schema(
    {
        // Until you add auth, we keep a simple owner string you can switch to userId later
        owner: { type: String, index: true, default: 'anon' },
        title: { type: String, default: 'Untitled doc' },
        contentHtml: { type: String, default: '<h1>Untitled doc</h1><p></p>' }
        // If you decide to store TipTap JSON too:
        // contentJson: { type: Object, default: null }
    },
    { timestamps: true } // adds createdAt, updatedAt automatically
);

// Fast list-by-recent index
docSchema.index({ owner: 1, updatedAt: -1 });

const Doc = mongoose.model('Doc', docSchema);

// Small helper: convert Mongo doc -> client shape
const toClient = (d) => ({
    id: d._id.toString(),
    title: d.title,
    contentHtml: d.contentHtml,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
});

// Pull a “fake user” from header to simulate multi-user during dev.
// If not provided, we fall back to "anon".
function getOwner(req) {
    return (req.headers['x-owner'] && String(req.headers['x-owner']).trim()) || 'anon';
}

// ---------- Routes ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// List docs (most recent first)
app.get('/api/docs', async (req, res) => {
    const owner = getOwner(req);
    const docs = await Doc.find({ owner }).sort({ updatedAt: -1 }).lean();
    res.json(docs.map(toClient));
});

// Create a new doc
app.post('/api/docs', async (req, res) => {
    const owner = getOwner(req);
    const { title = 'Untitled doc', contentHtml = '<h1>Untitled doc</h1><p></p>' } = req.body || {};
    const doc = await Doc.create({ owner, title, contentHtml });
    res.status(201).json(toClient(doc));
});

// Read one doc
app.get('/api/docs/:id', async (req, res) => {
    const owner = getOwner(req);
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });

    const doc = await Doc.findOne({ _id: id, owner }).lean();
    if (!doc) return res.status(404).json({ error: 'not found' });
    res.json(toClient(doc));
});

// Update (autosave)
app.put('/api/docs/:id', async (req, res) => {
    const owner = getOwner(req);
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });

    const { title, contentHtml } = req.body || {};
    const update = {
        ...(title != null ? { title } : {}),
        ...(contentHtml != null ? { contentHtml } : {})
    };

    const doc = await Doc.findOneAndUpdate(
        { _id: id, owner },
        update,
        { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: 'not found' });
    res.json(toClient(doc));
});

// Delete
app.delete('/api/docs/:id', async (req, res) => {
    const owner = getOwner(req);
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });

    await Doc.deleteOne({ _id: id, owner });
    res.json({ ok: true });
});

// health check
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
});




// AI STUFF

// mock AI endpoints so your UI works now
app.post("/api/ai/inline", (req, res) => {
    const { prompt } = req.body ?? {};
    res.json({ answer: `Mock explanation for: ${prompt}` });
});
app.post("/api/ai/chat", (req, res) => {
    const { prompt } = req.body ?? {};
    res.json({ answer: `Mock chat reply for: ${prompt}` });
});

// OPTIONAL: define "/" so the root doesn’t show "Cannot GET /"
app.get("/", (_req, res) => res.send("API is running. Try GET /api/health"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

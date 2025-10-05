import { connect } from '../_lib/mongoose.js';
import Doc from '../_lib/models/doc.js';

export default async function (req, res) {
  try {
    await connect();

    function getOwner(req) {
      return (req.headers['x-owner'] && String(req.headers['x-owner']).trim()) || 'anon';
    }

    if (req.method === 'GET') {
      const owner = getOwner(req);
      const docs = await Doc.find({ owner }).sort({ updatedAt: -1 }).lean();
      return res.status(200).json(docs.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        contentHtml: d.contentHtml,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })));
    }

    if (req.method === 'POST') {
      const owner = getOwner(req);
      const { title = 'Untitled doc', contentHtml = '<h1>Untitled doc</h1><p></p>' } = req.body || {};
      const doc = await Doc.create({ owner, title, contentHtml });
      return res.status(201).json({
        id: doc._id.toString(),
        title: doc.title,
        contentHtml: doc.contentHtml,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      });
    }

    res.setHeader('Allow', 'GET,POST');
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('API /api/docs error:', err && (err.stack || err.message || err));
    res.status(500).json({ error: 'Internal server error', detail: String(err?.message || err) });
  }
}

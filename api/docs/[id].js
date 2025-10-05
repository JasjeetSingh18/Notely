import { connect, mongoose } from '../_lib/mongoose.js';
import Doc from '../_lib/models/doc.js';

export default async function (req, res) {
  await connect();

  function getOwner(req) {
    return (req.headers['x-owner'] && String(req.headers['x-owner']).trim()) || 'anon';
  }

  const { id } = req.query || {};

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'invalid id' });

  if (req.method === 'GET') {
    const owner = getOwner(req);
    const doc = await Doc.findOne({ _id: id, owner }).lean();
    if (!doc) return res.status(404).json({ error: 'not found' });
    return res.json({
      id: doc._id.toString(),
      title: doc.title,
      contentHtml: doc.contentHtml,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  if (req.method === 'PUT') {
    const owner = getOwner(req);
    const { title, contentHtml } = req.body || {};
    const update = {
      ...(title != null ? { title } : {}),
      ...(contentHtml != null ? { contentHtml } : {}),
    };
    const doc = await Doc.findOneAndUpdate({ _id: id, owner }, update, { new: true, runValidators: true }).lean();
    if (!doc) return res.status(404).json({ error: 'not found' });
    return res.json({
      id: doc._id.toString(),
      title: doc.title,
      contentHtml: doc.contentHtml,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  if (req.method === 'DELETE') {
    const owner = getOwner(req);
    await Doc.deleteOne({ _id: id, owner });
    return res.json({ ok: true });
  }

  res.setHeader('Allow', 'GET,PUT,DELETE');
  res.status(405).end('Method Not Allowed');
}

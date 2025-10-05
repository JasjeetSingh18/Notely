import { mongoose } from '../mongoose.js';

const docSchema = new mongoose.Schema(
  {
    owner: { type: String, index: true, default: 'anon' },
    title: { type: String, default: 'Untitled doc' },
    contentHtml: { type: String, default: '<h1>Untitled doc</h1><p></p>' },
  },
  { timestamps: true }
);
docSchema.index({ owner: 1, updatedAt: -1 });

// Avoid model recompilation in serverless environment
const Doc = mongoose.models?.Doc || mongoose.model('Doc', docSchema);

export default Doc;

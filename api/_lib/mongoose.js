import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notely';

// Simple global cache to avoid multiple connections in serverless environments
if (!global._notely_mongoose) {
  global._notely_mongoose = { conn: null, promise: null };
}

export async function connect() {
  if (global._notely_mongoose.conn) return global._notely_mongoose.conn;

  if (!global._notely_mongoose.promise) {
    global._notely_mongoose.promise = mongoose
      .connect(MONGODB_URI)
      .then((conn) => conn);
  }

  global._notely_mongoose.conn = await global._notely_mongoose.promise;
  return global._notely_mongoose.conn;
}

export { mongoose };

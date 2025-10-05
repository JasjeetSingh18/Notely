import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Simple global cache to avoid multiple connections in serverless environments
if (!global._notely_mongoose) {
  global._notely_mongoose = { conn: null, promise: null };
}

export async function connect() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Set the environment variable in Vercel or provide a valid connection string.');
  }

  if (global._notely_mongoose.conn) return global._notely_mongoose.conn;

  if (!global._notely_mongoose.promise) {
    // Start connecting once and cache the promise
    global._notely_mongoose.promise = mongoose
      .connect(MONGODB_URI)
      .then((conn) => conn)
      .catch((err) => {
        // Reset promise so subsequent invocations can retry
        global._notely_mongoose.promise = null;
        throw err;
      });
  }

  global._notely_mongoose.conn = await global._notely_mongoose.promise;
  return global._notely_mongoose.conn;
}

export { mongoose };

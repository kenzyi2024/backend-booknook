import mongoose from 'mongoose';

/**
 * Connect to MongoDB once at startup.
 * Fails fast (exits the process) if the connection can't be established,
 * so the server never runs in a half-broken state.
 */
export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not set in your .env file.');

    // Strict query filtering keeps typos in query keys from silently matching everything.
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

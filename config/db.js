import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    if (!process.env.MONGODB_URL) {
      console.error("❌ MONGODB_URL missing");
      throw new Error("MONGODB_URL env var required");
    }

    cached.promise = mongoose.connect(process.env.MONGODB_URL, opts).then((mongooseInstance) => {
      console.log("✅ MongoDB connected");
      return mongooseInstance.connection;
    }).catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;


export default connectDB;

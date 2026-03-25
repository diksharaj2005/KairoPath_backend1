import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Check if MONGODB_URL is defined
    if (!process.env.MONGODB_URL) {
      console.error("MONGODB_URL is not defined in environment variables");
      process.exit(1);
    }
    
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed");
    console.error("Error:", error.message);
    console.error("Error name:", error.name);
    // Don't exit immediately to allow server to start for debugging
    // process.exit(1);
  }
};

export default connectDB;

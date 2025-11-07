import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Timeout after 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000, // Give up initial connection after 30s
    });

    console.log("✅ MongoDB connected successfully");
    console.log(`Connected to database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:");
    console.error("Error message:", err.message);
    if (err.code) console.error("Error code:", err.code);
    if (err.name) console.error("Error name:", err.name);
    process.exit(1);
  }
};

export default connectDB;

import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt += 1;
      console.log(`MongoDB: connection attempt ${attempt}/${maxRetries}`);

      await mongoose.connect(config.MONGO_URI, {
        serverSelectionTimeoutMS: 30000, // Timeout after 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        connectTimeoutMS: 30000, // Give up initial connection after 30s
      });

      console.log("✅ MongoDB connected successfully");
      console.log(`Connected to database: ${mongoose.connection.name}`);
      return;
    } catch (err) {
      console.error("❌ MongoDB connection error:");
      console.error("Error message:", err.message);
      if (err.code) console.error("Error code:", err.code);
      if (err.name) console.error("Error name:", err.name);

      if (attempt >= maxRetries) {
        console.error(`Exceeded ${maxRetries} connection attempts. Exiting.`);
        process.exit(1);
      }

      const waitMs = Math.min(30000, 1000 * Math.pow(2, attempt)); // exp backoff, cap 30s
      console.log(`Retrying MongoDB connection in ${waitMs / 1000}s...`);
      await new Promise((res) => setTimeout(res, waitMs));
    }
  }
};

export default connectDB;

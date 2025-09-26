import mongoose from "mongoose";
import appConfig from "./setting.js";

const connect = async () => {
    try {
        if (!appConfig.mongoUri) {
            throw new Error("MONGO_URI is missing in environment variables");
        }

        console.log("🔎 Connecting to:", appConfig.mongoUri);

        await mongoose.connect(appConfig.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connect;

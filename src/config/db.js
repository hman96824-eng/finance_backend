import mongoose from "mongoose";
import appConfig from "./config.js";

const connect = async () => {
    try {
        const uri = process.env.MONGO_URI || appConfig.mongoUri;
        if (!uri) {
            throw new Error("MongoDB connection string is missing");
        }

        console.log("🔎 Connecting to:", uri);

        await mongoose.connect(uri, {
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

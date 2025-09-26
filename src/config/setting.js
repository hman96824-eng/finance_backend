// src/config/settings.js
import dotenv from "dotenv";
dotenv.config();

export const Config = {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    jwt: {
        secret: process.env.JWT_SECRET || "supersecretkey",
        expireIn: process.env.JWT_EXPIRES_IN || "1d",
    },
    email: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS,
    },
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000"
};

export default Config;

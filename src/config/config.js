// src/config/settings.js
import dotenv from "dotenv";
dotenv.config();

const appConfig = {
    mongoUri: process.env.MONGO_URI,
    frontEndUrl: process.env.FRONTEND_URL || "http://localhost:3000/",
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
};

export default appConfig;


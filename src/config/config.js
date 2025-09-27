import dotenv from "dotenv";
dotenv.config();
export const config = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_USER: process.env.USER_EMAIL,
    EMAIL_PASS: process.env.USER_PASS,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
    EMAIL_HOST: process.env.EMAIL_HOST,
    ACCESS_EXPIRES_IN: process.env.ACCESS_EXPIRES_IN,
    REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    frontEndUrl: process.env.FRONTEND_URL || "http://localhost:3000/",
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
};

export default config;

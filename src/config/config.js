import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT,//
  MONGO_URI: process.env.MONGO_URI,//
  JWT_SECRET: process.env.JWT_SECRET,//
  NODE_ENV: process.env.NODE_ENV,//
  USER_EMAIL: process.env.USER_EMAIL,//
  USER_PASS: process.env.USER_PASS,//
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  EMAIL_HOST: process.env.EMAIL_HOST,
  ACCESS_EXPIRES_IN: process.env.ACCESS_EXPIRES_IN,//
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN,//
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,//
  frontEndUrl: process.env.CLIENT_URL,//
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,//
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  // GOOGLE_CALLBACK_URL:
  //   process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback",
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};

export default config;

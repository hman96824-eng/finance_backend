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
};

export default config;

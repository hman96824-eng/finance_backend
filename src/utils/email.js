import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import { config } from "../config/config.js"

export const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ Gmail service
  auth: {
    user: config.USER_EMAIL, // your gmail address
    pass: config.USER_PASS,  // your 16-char App Password
  },
});

export default transporter;
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ Gmail service
  auth: {
    user: process.env.USER_EMAIL, // your gmail address
    pass: process.env.USER_PASS,  // your 16-char App Password
  },
});

export default transporter;
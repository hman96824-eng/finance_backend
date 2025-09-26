import nodemailer from "nodemailer";
import { config } from "./config.js";

console.log("email", config.EMAIL_USER);
console.log("password", config.EMAIL_PASS);
// email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

export default transporter;

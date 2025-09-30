import nodemailer from "nodemailer";
import { config } from "../config/config.js"

export const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ Gmail service
  auth: {
    user: config?.USER_EMAIL, // your gmail address
    pass: config?.USER_PASS,  // your 16-char App Password
  },
});



console.log(config?.USER_EMAIL, "email2");
console.log(config?.USER_PASS, "pass");


export default transporter;
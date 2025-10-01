


import sgMail from "@sendgrid/mail";
import { config } from "../config/config.js"; // where your envs are
sgMail.setApiKey(config.SENDGRID_API_KEY);

/**
 * Send Email using SendGrid
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @param {string} [from=config.USER_EMAIL] - Sender email
*/
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const msg = {
      to,
      from: config.USER_EMAIL,
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error.response?.body || error);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;
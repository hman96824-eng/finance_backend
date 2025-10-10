import sgMail from "@sendgrid/mail";
import { config } from "../config/config.js";

sgMail.setApiKey(config.SENDGRID_API_KEY);

/**
 * Send Email using SendGrid (Spam-Safe version)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const msg = {
      to,
      from: {
        email: config.USER_EMAIL,
        name: "Invextech",
      },
      subject,
      html,
      text: "welcome our company",
      trackingSettings: {
        clickTracking: { enable: false },
      },
      headers: {
        "X-Mailer": "Onu Mailer",
      },
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.response?.body || error);
    throw new Error("Failed to send email");
  }
};

export default sendEmail
import jwt from "../utils/jwt.helper.js";
import { findByEmail } from "./repository.js";
import ApiError from "../utils/ApiError.js";
import { messages } from "../../constants/messages.js";
import { config } from "../../config/config.js";
import transporter from "../../config/mail.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.helper.js";
import GenerateOtpEmailTemplate from "../utils/email/emailTemplate.js";

// login user
export const login = async ({ email, password }) => {
  const user = await findByEmail(email);
  if (!user) throw new ApiError(404, messages.USER_NOT_FOUND);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new ApiError(401, messages.INVALID_CREDENTIALS);

  const token = jwt.generateToken({
    id: user._id,
    role: user.role_id,
    email: user.email,
  });

  return {
    token,
    user: { id: user._id, email: user.email, role: user.role_id },
  };
};
// forget password
export const forgetpassword = async ({ email }) => {
  const user = await findByEmail(email);
  if (!user) throw new ApiError(404, messages.USER_NOT_FOUND);
  // generate otp to user  otp code
  const otp = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  console.log("otp is: ", otp);

  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mint
  console.log("otp is: ", expiry);

  (user.resetCode = otp), (user.resetCodeExpires = expiry);
  await user.save();

  // send mail
  transporter.sendMail({
    from: config.EMAIL_USER,
    to: user.email,
    subject: messages.EMAIL_SENT_SUBJECT,
    html: GenerateOtpEmailTemplate(otp),
  });
};
// verify password
export const verifyCode = async ({ email, code }) => {
  console.log("reset password service", email, code);

  const user = await findByEmail(email);
  if (!user) throw new ApiError(404, messages.USER_NOT_FOUND);
  if (!user.resetCode || !user.resetCodeExpires)
    throw new ApiError(404, messages.OTP_REQUEST_NOT_FOUND);
  if (user.resetCodeExpires < new Date())
    throw new ApiError(401, messages.OTP_EXPIRED);
  if (user.resetCode !== code) throw new ApiError(401, messages.INVALID_OTP);
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();
  return { message: messages.VERIFIED_OTP };
};
// chnage password
export const resetPassword = async ({
  email,
  newPassword,
  confirmPassword,
}) => {
  const user = await findByEmail(email);
  if (!user) throw new ApiError(404, messages.USER_NOT_FOUND);
  const isSame = await comparePassword(newPassword, user.password);
  if (isSame) throw new Error(messages.NEW_PASSWORD);
  if (newPassword !== confirmPassword)
    throw new ApiError(401, messages.PASSWORD_UNMATCH);
  const hashpassword = await hashPassword(newPassword);
  user.password = hashpassword;
  await user.save();
};

export default {
  login,
  forgetpassword,
  verifyCode,
  resetPassword,
};

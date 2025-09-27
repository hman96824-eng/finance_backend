import jwt from "../utils/jwt.helper.js";
import { findByEmail, findByEmailotp } from "./repository.js";
import ApiError from "../utils/ApiError.js";
import { messages } from "../../constants/messages.js";
import { config } from "../../config/config.js";
import transporter from "../../config/mail.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.helper.js";
import GenerateOtpEmailTemplate from "../utils/email/emailTemplate.js";
import User from "./model.js";
import Otp from "./temp/otp.model.js";

// login user
export const login = async ({ email, password }) => {
  const user = await findByEmail(email);
  if (!user) throw new ApiError(404, messages.USER_NOT_FOUND);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new ApiError(401, messages.INVALID_CREDENTIALS);

  const payload = {
    id: user._id,
    role: user.role_id,
    email: user.email,
  };
  const accessToken = jwt.generateToken(payload);
  const refreshToken = jwt.generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, role: user.role_id },
  };
};

// register user

export const signup = async ({
  name,
  email,
  phone,
  role_id,
  password,
  confirmPassword,
}) => {
  const user = await findByEmail(email);
  if (user) throw new ApiError(404, messages.USER_EXISTS);

  if (password !== confirmPassword)
    throw new ApiError(401, messages.PASSWORD_UNMATCH);

  const hashpassword = await hashPassword(password);

  const otp = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  console.log(otp, "otp is ------");
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry time s

  // Update or create OTP record
  await Otp.findOneAndUpdate(
    { email },
    {
      email,
      otp,
      expiry,
      userData: { name, email, password: hashpassword, phone, role_id },
    },
    { upsert: true, new: true }
  );

  // send email
  await transporter.sendMail({
    from: config.EMAIL_USER,
    to: email,
    subject: "verification email",
    html: GenerateOtpEmailTemplate(otp),
  });
};

// verify new user
export const verifySignup = async ({ email, code }) => {
  const otpRecord = await findByEmailotp(email);
  if (!otpRecord) throw new ApiError(404, messages.USER_NOT_FOUND);

  if (otpRecord.expiry < new Date()) {
    throw new ApiError(404, messages.OTP_EXPIRED);
  }

  if (otpRecord.otp !== code) throw new ApiError(401, messages.INVALID_OTP);

  // Create new user
  const newUser = new User({
    name: otpRecord.userData.name,
    email: otpRecord.userData.email,
    password: otpRecord.userData.password,
    phone: otpRecord.userData.phone,
    role_id: otpRecord.userData.role_id,
    status: "active",
  });
  await newUser.save();

  await Otp.deleteOne();
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
  signup,
  verifySignup,
  forgetpassword,
  verifyCode,
  resetPassword,
};

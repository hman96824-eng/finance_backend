import jwt from "../../utils/jwt.helper.js";
import ApiError from "../../utils/ApiError.js";
import { messages } from "../../constants/messages.js";
import { config } from "../../config/config.js";
import transporter from "../../utils/email.js";
import { comparePassword, hashPassword } from "../../utils/bcrypt.helper.js";
import GenerateOtpEmailTemplate from "../../utils/templates/OtpGenerator.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import templates from "../../utils/templates/invitationEmail.js";
import { UserModel } from "./model.js"
import { OtpModel } from "../otp/model.js";
import { InviteModel } from "../invites/model.js";
import Repository from "../../utils/repository.js";


// Instantiate repositories for models
const userRepo = new Repository(UserModel);
const otpRepo = new Repository(OtpModel);
const inviteRepo = new Repository(InviteModel);

export const login = async ({ email, password }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);

  const payload = { id: user._id, role: user.role_id, email: user.email };
  const accessToken = jwt.generateToken(payload);
  const refreshToken = jwt.generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, role: user.role_id },
  };
};
export const signup = async ({ name, email, phone, role_id, password, confirmPassword }) => {
  const user = await userRepo.findOne({ email });
  if (user) throw ApiError.unauthorized(messages.USER_EXISTS);
  if (password !== confirmPassword) throw ApiError.unauthorized(messages.PASSWORD_UNMATCH);

  const hashpassword = await hashPassword(password);
  const otp = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  await otpRepo.update(
    { email },
    { email, otp, expiry, userData: { name, email, password: hashpassword, phone, role_id } },
    { upsert: true, new: true }
  );

  await transporter.sendMail({
    from: config.USER_EMAIL,
    to: email,
    subject: "Verification Email",
    html: GenerateOtpEmailTemplate(otp),
  });
};
export const verifySignup = async ({ email, code }) => {
  const otpRecord = await otpRepo.findOne({ email });
  if (!otpRecord) throw ApiError.unauthorized(messages.USER_NOT_FOUND);
  if (otpRecord.expiry < new Date()) throw ApiError.unauthorized(messages.OTP_EXPIRED);
  if (otpRecord.otp !== code) throw ApiError.badRequest(messages.INCORRECT_OTP);

  const newUser = await userRepo.create({
    name: otpRecord.userData.name,
    email: otpRecord.userData.email,
    password: otpRecord.userData.password,
    phone: otpRecord.userData.phone,
    role_id: otpRecord.userData.role_id,
    status: "active",
  });

  await otpRepo.delete({ email });
  return newUser;
};
export const forgetpassword = async ({ email }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);

  const otp = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetCode = otp;
  user.resetCodeExpires = expiry;
  await user.save();

  await transporter.sendMail({
    from: config.USER_EMAIL,
    to: user.email,
    subject: messages.EMAIL_SENT_SUBJECT,
    html: GenerateOtpEmailTemplate(otp),
  });
};

export const verifyCode = async ({ email, code }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);
  if (!user.resetCode || !user.resetCodeExpires)
    throw ApiError.notFound(messages.OTP_REQUEST_NOT_FOUND);
  if (user.resetCodeExpires < new Date())
    throw ApiError.unauthorized(messages.OTP_EXPIRED);
  if (user.resetCode !== code)
    throw ApiError.badRequest(messages.INVALID_OTP);
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();
  return { message: messages.VERIFIED_OTP };
};

export const resetPassword = async ({ email, newPassword, confirmPassword }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  const isSame = await comparePassword(newPassword, user.password);
  if (isSame) throw ApiError.badRequest(messages.NEW_PASSWORD);
  if (newPassword !== confirmPassword)
    throw ApiError.badRequest(messages.PASSWORD_UNMATCH);

  const hashpassword = await hashPassword(newPassword);
  user.password = hashpassword;
  await user.save();
};

export const getAllUsers = async () => userRepo?.find();
export const getUserById = async (id) => userRepo?.findById(id);

export const createInvite = async (email, role_id) => {
  console.log("check 8");

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = await userRepo?.findOne({ email: cleanEmail });
  if (existingUser) {
    throw ApiError?.unauthorized(messages.USER_ALREADY_EXISTS);
  } else {
    await inviteRepo?.update(
      { email: cleanEmail },
      { $set: { accepted: false } }
    );
    console.log("cehck 9");

  }


  let invite = await inviteRepo?.findOne({ email: cleanEmail });
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  if (invite) {
    invite.token = token;
    invite.expiresAt = expiresAt;
    invite.invite = invite.invite + 1;
    await invite.save();
    console.log("check 10");

  } else {
    invite = await inviteRepo.create({ email: cleanEmail, role_id, token, expiresAt, invite: 1 });
    console.log("check 11");

  }

  await transporter.sendMail({
    from: `Onu Team ${config.USER_EMAIL}`,
    to: cleanEmail,
    subject: "📩 You’re Invited to Join Onu",
    html: templates.generateTeamInviteTemplate(invite.token, role_id),
  });
  console.log("check 12");


  return invite;
};
export const registerUser = async (inviteToken, userData) => {
  const { name, phone, password, confirmPassword } = userData;
  if (!password || password !== confirmPassword) throw ApiError.unauthorized(messages.PASSWORD_INVALID);

  const invite = await inviteRepo.findOne({ token: inviteToken });
  if (!invite) throw ApiError.unauthorized(messages.TOKEN_INVALID);
  if (!invite.expiresAt || invite.expiresAt < new Date())
    throw ApiError.badRequest(messages.TOKEN_EXPIRED);
  // if (invite.accepted && ) throw new Error("Invitation already used.");

  const existingUser = await userRepo.findOne({ email: invite.email });
  if (existingUser && invite.accepted) throw ApiError.unauthorized(messages.USER_ALREADY_EXISTS);

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userRepo.create({
    name,
    email: invite.email,
    phone,
    password: hashedPassword,
    role_id: invite.role_id,
    status: "active",
  });

  invite.accepted = true;
  invite.token = null;
  invite.expiresAt = null;
  await invite.save();

  const authToken = jwt.generateToken(
    { id: newUser._id, email: newUser.email, role: newUser.role_id },
    config.JWT_EXPIRES_IN || "1d"
  );

  return {
    message: messages.SIGNUP_SUCCESS,
    user: { id: newUser._id, name: newUser.name, email: newUser.email, role_id: newUser.role_id },
    token: authToken,
  };
};
export const toggleUserStatus = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  user.status = user.status === "active" ? "inactive" : "active";
  await user.save();

  return {
    message: messages.USER_STATUS_UPDATED,
    user: { id: user._id, name: user.name, email: user.email, status: user.status },
  };
};
export default {
  login,
  signup,
  verifySignup,
  forgetpassword,
  verifyCode,
  resetPassword,
  getAllUsers,
  getUserById,
  createInvite,
  registerUser,
  toggleUserStatus,
};

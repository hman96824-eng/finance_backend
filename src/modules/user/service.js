import jwt from "../../utils/jwt.helper.js";
import ApiError from "../../utils/ApiError.js";
import { messages } from "../../constants/messages.js";
import { config } from "../../config/config.js";
import { comparePassword, hashPassword } from "../../utils/bcrypt.helper.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../config/cloud.js";
import GenerateOtpEmailTemplate from "../../utils/templates/OtpGenerator.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import templates from "../../utils/templates/invitationEmail.js";
import { UserModel } from "./model.js";
import { RoleModel } from "../role/model.js";
import { InviteModel } from "../invites/model.js";
import Repository from "../../utils/repository.js";
import sendEmail from "../../utils/email.js";
import fs from "fs";
import { io } from "../../server.js";

// Instantiate repositories for models
const userRepo = new Repository(UserModel);
const inviteRepo = new Repository(InviteModel);
const roleRepo = new Repository(RoleModel);

// --------------------------------------------------
// 🔹 Helper: Filter user response (remove sensitive + employee)
// --------------------------------------------------
const filterUserResponse = (userDoc) => {
  if (!userDoc) return null;
  // if it's a mongoose document, convert to plain object
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;

  // Remove sensitive/internal fields
  delete user.password;
  delete user.resetCode;
  delete user.resetCodeExpires;
  delete user.employee; // explicitly remove employee reference object
  // If employee exists as ObjectId, keep it if you want — but per request do not populate or return it
  if (user.employee && typeof user.employee === "object") delete user.employee;

  // Keep role name if populated, otherwise keep role ObjectId string
  const roleName = user.role_id?.name || null;

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    cnic: user.cnic || null,
    status: user.status,
    role: roleName,
    description: user.description || null,
    bio: user.bio || null,
    address: user.address || null,
    gender: user.gender || null,
    nationality: user.nationality || null,
    maritalStatus: user.maritalStatus || null,
    avatar: user.avatar || null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
};

// --------------------------------------------------
// 🔹 Auth: login
// --------------------------------------------------
export const login = async ({ email, password }) => {
  // find user and populate role name/description only; exclude employee and keep password for verification
  const user = await userRepo.findOneWithPopulate(
    { email },
    "role_id",
    "name description"
  );

  // console.log(user, "user login service");
  if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);
  if (user.status !== "active") throw ApiError.unauthorized(messages.IsActive);

  if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);

  if (user.status?.toLowerCase() === "inactive") {
    throw ApiError.unauthorized(messages.IsActive);
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);

  // Prepare JWT payload
  const payload = {
    id: user._id,
    role: user.role_id?.name || "UNKNOWN",
    email: user.email,
    role_id: user.role_id?._id || null,
  };

  console.log(payload, "token payload");

  const accessToken = jwt.generateToken(payload);

  // sanitize and return
  const filtered = filterUserResponse(user);
  return {
    accessToken,
    user: filtered,
  };
};

// --------------------------------------------------
// 🔹 Auth: signup
// --------------------------------------------------
export const signup = async ({ name, email, phone, role, password, confirmPassword }) => {
  const existing = await userRepo.findOne({ email });
  if (existing) throw ApiError.unauthorized(messages.USER_EXISTS);

  const rolecheck = await roleRepo.findOne({ name: role });
  if (!rolecheck) throw ApiError.badRequest(messages.ROLE_NOT_DEFINE);

  // hash password
  const hashpassword = await hashPassword(password);

  const firstLetter = name.charAt(0).toUpperCase();
  const avatarUrl = `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff&size=128`;

  const newUser = await userRepo.create({
    name,
    email,
    password: hashpassword,
    phone,
    role_id: rolecheck._id,
    status: "inactive",
    avatar: {
      url: avatarUrl,
      public_id: null,
      default_letter: firstLetter,
    },
  });

  const notification = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: rolecheck.name,
    status: newUser.status,
    avatar: newUser.avatar,
  };

  io.emit("new_user_registered", notification);

  // return sanitized user + notification
  const populated = await userRepo.findByIdWithPopulate(newUser._id, "role_id", "name description");
  return { newUser: filterUserResponse(populated), notification };
};

// --------------------------------------------------
// 🔹 forgetpassword
// --------------------------------------------------
export const forgetpassword = async ({ email }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);

  const otp = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetCode = otp;
  user.resetCodeExpires = expiry;
  await user.save();

  await sendEmail({
    to: email,
    subject: messages.EMAIL_SENT_SUBJECT,
    html: GenerateOtpEmailTemplate(otp),
  });

  return { message: messages.OTP_SENT_MESSAGE };
};

// --------------------------------------------------
// 🔹 verifyCode
// --------------------------------------------------
export const verifyCode = async ({ email, code }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);
  if (!user.resetCode || !user.resetCodeExpires)
    throw ApiError.notFound(messages.OTP_REQUEST_NOT_FOUND);
  if (user.resetCodeExpires < new Date())
    throw ApiError.unauthorized(messages.OTP_EXPIRED);
  if (user.resetCode !== code) throw ApiError.badRequest(messages.INVALID_OTP);
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();
  return { message: messages.VERIFIED_OTP };
};

// --------------------------------------------------
// 🔹 resetPassword
// --------------------------------------------------
export const resetPassword = async ({ email, newPassword, confirmPassword }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  const isSame = await comparePassword(newPassword, user.password);
  if (isSame) throw ApiError.badRequest(messages.NEW_PASSWORD);
  if (newPassword !== confirmPassword) throw ApiError.badRequest(messages.PASSWORD_UNMATCH);

  const hashpassword = await hashPassword(newPassword);
  user.password = hashpassword;
  await user.save();

  return { message: messages.PASSWORD_RESET };
};

// --------------------------------------------------
// 🔹 passowrdChange
// --------------------------------------------------
export const passowrdChange = async (userId, currentPassword, newPassword, confirmNewPassword) => {
  const user = await userRepo.findById(userId);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw ApiError.badRequest(messages.PASSWORD_UNMATCH);

  if (newPassword === currentPassword) throw ApiError.badRequest(messages.NEW_PASSWORD);
  if (newPassword !== confirmNewPassword) throw ApiError.badRequest(messages.CONFIRM_PASSWORD);

  const passwordhash = await hashPassword(newPassword);
  user.password = passwordhash;
  await user.save();

  return { message: messages.PASSWORD_RESET_SUCCESS };
};

// --------------------------------------------------
// 🔹 getUserById
// --------------------------------------------------
export const getUserById = async (id) => {
  const user = await userRepo.findByIdWithPopulate(id, "role_id", "name description");
  if (!user) {
    throw ApiError.notFound(messages.USER_NOT_FOUND);
  }

  return filterUserResponse(user);
};

// --------------------------------------------------
// 🔹 getAllUsers
// --------------------------------------------------
export const getAllUsers = async (filter = {}) => {
  const baseFilter = {
    status: { $in: ["active", "inactive", "deleted"] },
    ...filter,
  };

  // ensure we do not populate employee
  const users = await userRepo.findWithPopulate(baseFilter, "role_id", "name description");

  // convert and filter each
  return users.map((u) => filterUserResponse(u));
};

// --------------------------------------------------
// 🔹 countUsersByStatus
// --------------------------------------------------
export const countUsersByStatus = async (status) => {
  return userRepo.count({ status });
};

// --------------------------------------------------
// 🔹 updateProfile
// --------------------------------------------------
export const updateProfile = async (userId, updateData) => {
  const allowedFields = [
    "name",
    "phone",
    "address",
    "gender",
    "nationality",
    "maritalStatus",
    "department",
    "salary",
    "description",
  ];

  if ("avatar" in updateData) {
    delete updateData.avatar;
  }

  const filteredData = Object.keys(updateData)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  const updatedUser = await userRepo.updateProfile(userId, filteredData);
  if (!updatedUser) throw new Error("User not found");

  const userWithRole = await userRepo.findByIdWithPopulate(userId, "role_id", "name description");
  if (!userWithRole) throw new Error("User not found");

  return filterUserResponse(userWithRole);
};

// --------------------------------------------------
// 🔹 createInvite
// --------------------------------------------------
export const createInvite = async (email, role_id) => {
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = await userRepo?.findOne({ email: cleanEmail });
  if (existingUser) {
    throw ApiError?.unauthorized(messages.USER_ALREADY_EXISTS);
  } else {
    await inviteRepo?.update({ email: cleanEmail }, { $set: { accepted: false } });
  }

  let invite = await inviteRepo?.findOne({ email: cleanEmail });
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  if (invite) {
    invite.token = token;
    invite.expiresAt = expiresAt;
    invite.invite = invite.invite + 1;
    await invite.save();
  } else {
    invite = await inviteRepo.create({
      email: cleanEmail,
      role_id,
      token,
      expiresAt,
      invite: 1,
    });
  }

  await sendEmail({
    to: email,
    subject: "Accept Your Manager Position",
    text: "You’re invited to join Onu. Click the link to register.",
    html: templates.generateTeamInviteTemplate(invite?.token, role_id, email),
  });

  return invite;
};

// --------------------------------------------------
// 🔹 registerUser (invite flow)
// --------------------------------------------------
export const registerUser = async (inviteToken, newRole, userData) => {
  const { name, phone, password, confirmPassword } = userData;
  if (!password || password !== confirmPassword) throw ApiError.unauthorized(messages.PASSWORD_INVALID);

  const NewRole = await roleRepo.findOne({ name: newRole });
  if (!NewRole) throw ApiError.unauthorized(messages.ROLE_NOT_FOUND);

  const invite = await inviteRepo.findOne({ token: inviteToken });
  if (!invite) throw ApiError.unauthorized(messages.TOKEN_INVALID);
  if (!invite.expiresAt || invite.expiresAt < new Date()) throw ApiError.badRequest(messages.TOKEN_EXPIRED);

  const existingUser = await userRepo.findOne({ email: invite.email });
  if (existingUser && invite.accepted) throw ApiError.unauthorized(messages.USER_ALREADY_EXISTS);

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userRepo.create({
    name,
    email: invite.email,
    phone,
    password: hashedPassword,
    role_id: NewRole._id,
    status: "active",
  });

  invite.accepted = true;
  invite.token = null;
  invite.expiresAt = null;
  await invite.save();

  return {
    message: messages.SIGNUP_SUCCESS,
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role_id: newUser.role_id,
    },
  };
};

// --------------------------------------------------
// 🔹 toggleUserStatus
// --------------------------------------------------
export const toggleUserStatus = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  user.status = user.status === "active" ? "inactive" : "active";
  await user.save();

  const updatedUser = await userRepo.findByIdWithPopulate(id, "role_id", "name description");
  return { message: messages.USER_STATUS_UPDATED, user: filterUserResponse(updatedUser) };
};

// --------------------------------------------------
// 🔹 getInactiveUsers
// --------------------------------------------------
export const getInactiveUsers = async () => {
  try {
    const users = await userRepo.findObj(
      { status: "deleted" },
      {},
      {},
      { path: "role_id", select: "name" }
    );
    // return sanitized objects
    return (users || []).map((u) => filterUserResponse(u));
  } catch (error) {
    throw new Error("Failed to fetch inactive users: " + error.message);
  }
};

// --------------------------------------------------
// 🔹 archiveDeleteUser (permanent delete)
export const archiveDeleteUser = async (userId) => {
  try {
    const user = await userRepo.findOne({ _id: userId, status: "deleted" });
    if (!user) {
      throw new Error("User not found or already deleted");
    }

    await userRepo.deleteOne({ _id: userId });
    return { message: "User removed successfully" };
  } catch (error) {
    throw new Error("Failed to remove user: " + error.message);
  }
};

// --------------------------------------------------
// 🔹 archiveDeleteMultipleUsers
// --------------------------------------------------
export const archiveDeleteMultipleUsers = async (userIds) => {
  try {
    // Find users that match IDs and are in "deleted" status
    const users = await userRepo.find({
      _id: { $in: userIds },
      status: "deleted",
    });

    if (users.length === 0) {
      throw new Error("No users found or already permanently removed.");
    }

    // Delete them all
    const deleteResult = await userRepo.deleteMany({
      _id: { $in: userIds },
      status: "deleted",
    });

    return {
      message: `${deleteResult.deletedCount} user(s) removed successfully.`,
      deletedCount: deleteResult.deletedCount,
    };
  } catch (error) {
    throw new Error("Failed to remove users: " + error.message);
  }
};

// --------------------------------------------------
// 🔹 uploadProfileImage
// --------------------------------------------------
export const uploadProfileImage = async (reqFile, userId) => {
  // reqFile is expected to be req.file (multer)
  const user = await userRepo.findById(userId);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  if (!reqFile) throw ApiError.badRequest(messages.FILE_NOT_UPLOADED);

  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  const result = await uploadToCloudinary(reqFile.path, "user_avatars");

  user.avatar = {
    url: result.secure_url,
    public_id: result.public_id,
    default_letter: null,
  };
  await user.save();

  // remove temp file
  try {
    fs.unlinkSync(reqFile.path);
  } catch (e) {
    // ignore
  }

  const updated = await userRepo.findByIdWithPopulate(userId, "role_id", "name description");
  return filterUserResponse(updated);
};

// --------------------------------------------------
// 🔹 removeProfileImage
// --------------------------------------------------
export const removeProfileImage = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  const firstLetter = user.name.charAt(0).toUpperCase();
  const avatarUrl = `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff&size=128`;

  user.avatar = {
    url: avatarUrl,
    public_id: null,
    default_letter: firstLetter,
  };

  await user.save();

  const updated = await userRepo.findByIdWithPopulate(userId, "role_id", "name description");
  return filterUserResponse(updated);
};

// --------------------------------------------------
// 🔹 assignRole
// --------------------------------------------------
export const assignRole = async (id, newRoleName) => {
  const user = await userRepo.findById(id);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);
  if (!newRoleName) throw ApiError.badRequest(messages.ROLE_NOT_DEFINE);

  const role = await roleRepo.findOne({ name: newRoleName });
  if (!role) throw ApiError.notFound(messages.ROLE_NOT_FOUND);

  if (user.role_id?.toString() === role._id.toString()) {
    throw ApiError.badRequest(`User already has the role '${newRoleName}'`);
  }

  user.role_id = role._id;
  await user.save();

  const updated = await userRepo.findByIdWithPopulate(id, "role_id", "name description");
  return filterUserResponse(updated);
};

// --------------------------------------------------
// 🔹 deleteStatus (soft delete -> status = deleted)
// --------------------------------------------------
export const deleteStatus = async (id) => {
  try {
    const user = await userRepo.findById(id);
    if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

    if (user.status === "deleted")
      throw ApiError.badRequest(messages.USER_ALREADY_DELETED);

    user.status = "deleted";
    await user.save();
    return {
      success: true,
      message: "User status updated to deleted successfully",
      data: filterUserResponse(user),
    };
  } catch (error) {
    console.error("Service deleteUserStatus Error:", error);
    return {
      success: false,
      message: error.message || "Error deleting user status",
    };
  }
};

// --------------------------------------------------
// 🔹 softDeleteManyUsers
// --------------------------------------------------
export const softDeleteManyUsers = async (userIds) => {
  try {
    await userRepo.updateMany(
      { _id: { $in: userIds } },
      { $set: { status: "deleted" } }
    );
    // return count or some summary
    return { message: "Users marked as deleted", deletedCount: userIds.length };
  } catch (error) {
    throw new Error("Failed to soft delete users: " + error.message);
  }
};

// --------------------------------------------------
// 🔹 deleteManyArchivedUsers (permanent)
export const deleteManyArchivedUsers = async (userIds) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("userIds must be a non-empty array");
    }

    const result = await userRepo.deleteMany({ _id: { $in: userIds } });
    return result; // contains { acknowledged, deletedCount }
  } catch (error) {
    console.error("Error deleting invited users:", error.message);
    throw error;
  }
};

export default {
  login,
  uploadProfileImage,
  removeProfileImage,
  signup,
  forgetpassword,
  verifyCode,
  resetPassword,
  passowrdChange,
  getAllUsers,
  countUsersByStatus,
  getUserById,
  toggleUserStatus,
  getInactiveUsers,
  archiveDeleteUser,
  archiveDeleteMultipleUsers,
  updateProfile,
  assignRole,
  deleteStatus,
  softDeleteManyUsers,
  deleteManyArchivedUsers,
  createInvite,
  registerUser,
  // other functions preserved...
};

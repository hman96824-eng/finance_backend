import jwt from "../../utils/jwt.helper.js";
import ApiError from "../../utils/ApiError.js";
import { messages } from "../../constants/messages.js";
import { config } from "../../config/config.js";
import { comparePassword, hashPassword } from "../../utils/bcrypt.helper.js";
import { uploadToCloudinary, deleteFromCloudinary, } from "../../config/cloud.js";
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
const roleRepo = new Repository(RoleModel)

export const login = async ({ email, password }) => {
  // ✅ Step 1: Fetch user with role populated (only role name/description)
  const user = await userRepo.findOneWithPopulate(
    { email },
    "role_id",
    "name description"
  );
  if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);

  if (user.status?.toLowerCase() === "inactive") {
    throw ApiError.unauthorized(messages.IsActive);
  }

  // Prepare JWT payload
  const payload = {
    id: user._id,
    role: user.role_id?.name || "UNKNOWN",
    email: user.email,
  };

  const accessToken = jwt.generateToken(payload);

  // Remove sensitive fields
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.resetCode;
  delete userObj.resetCodeExpires;

  // Return full user data + role
  return {
    accessToken,
    user: {
      id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      phone: userObj.phone,
      status: userObj.status,
      role: userObj.role_id?.name || null,
      description: userObj?.description || null,
      salary: userObj.salary,
      address: userObj.address,
      gender: userObj.gender,
      nationality: userObj.nationality,
      maritalStatus: userObj.maritalStatus,
      department: userObj.department,
      avatar: userObj.avatar,
      created_at: userObj.createdAt,
      updated_at: userObj.updatedAt,

    },
  };
};
export const signup = async ({
  name,
  email,
  phone,
  role,
  password,
  confirmPassword,
}) => {
  const user = await userRepo.findOne({ email });
  if (user) throw ApiError.unauthorized(messages.USER_EXISTS);

  const rolecheck = await roleRepo.findOne({ name: role });
  if (!rolecheck) throw ApiError.badRequest(messages.ROLE_NOT_DEFINE);

  // if (password !== confirmPassword)
  //   throw ApiError.unauthorized(messages.PASSWORD_UNMATCH);

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

  // ✅ Build the notification data separately
  const notification = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: rolecheck.name,
    status: newUser.status,
    avatar: newUser.avatar,
  };

  // ✅ Emit event (no need to assign return)
  io.emit("new_user_registered", notification);

  return { newUser, notification };
};
export const forgetpassword = async ({ email }) => {
  const user = await userRepo.findOne({ email });
  if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);

  const otp = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetCode = otp;
  user.resetCodeExpires = expiry;
  await user.save();

  await sendEmail({
    to: email,
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
  if (user.resetCode !== code) throw ApiError.badRequest(messages.INVALID_OTP);
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();
  return { message: messages.VERIFIED_OTP };
};
export const resetPassword = async ({
  email,
  newPassword,
  confirmPassword,
}) => {
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
export const passowrdChange = async (
  userId,
  currentPassword,
  newPassword,
  confirmNewPassword
) => {
  const user = await userRepo.findById(userId);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw ApiError.badRequest(messages.PASSWORD_UNMATCH);

  if (newPassword === currentPassword)
    throw ApiError.badRequest(messages.NEW_PASSWORD);

  if (newPassword !== confirmNewPassword)
    throw ApiError.badRequest(messages.CONFIRM_PASSWORD);

  const passwordhash = await hashPassword(newPassword);
  user.password = passwordhash;
  await user.save();
};

export const getUserById = async (id) => {
  // ✅ Populate role_id but exclude permissions field
  const user = await userRepo.findByIdWithPopulate(id, "role_id", "-permissions");

  if (!user) {
    throw ApiError.notFound(messages.USER_NOT_FOUND);
  }

  const userObj = user.toObject();

  // ✅ Remove sensitive fields
  delete userObj.password;
  delete userObj.resetCode;
  delete userObj.resetCodeExpires;

  return userObj;
};
export const getAllUsers = async (filter = {}) => {
  const baseFilter = {
    status: { $in: ["active", "inactive"] },
    ...filter,
  };
  const users = await userRepo.findWithPopulate(baseFilter, "role_id", "name");

  return users.map((user) => ({
    ...user._doc,
    role: user.role_id?.name || null, // extract name
    role_id: undefined, // hide ObjectId
  }));
};
export const countUsersByStatus = async (status) => {
  return userRepo.count({ status });
};
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
    "avatar",
  ];

  // ✅ Filter allowed fields only
  const filteredData = Object.keys(updateData)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  // ✅ Auto generate avatar default letter
  if (filteredData.name && !filteredData.avatar) {
    filteredData.avatar = {
      default_letter: filteredData.name.charAt(0).toUpperCase(),
    };
  }

  // ✅ Update user profile
  const updatedUser = await userRepo.updateProfile(userId, filteredData);
  if (!updatedUser) throw new Error("User not found");

  // ✅ Fetch again with role populated (to include role name)
  const userWithRole = await userRepo.findByIdWithPopulate(
    userId,
    "role_id",
    "name description"
  );

  if (!userWithRole) throw new Error("User not found");

  // ✅ Convert to plain object & remove sensitive fields
  const userObj = userWithRole.toObject();
  delete userObj.password;
  delete userObj.resetCode;
  delete userObj.resetCodeExpires;

  return userObj;
};
export const toggleUserStatus = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

  user.status = user.status === "active" ? "inactive" : "active";
  await user.save();

  return {
    message: messages.USER_STATUS_UPDATED,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    },
  };
};
export const getInactiveUsers = async () => {
  try {
    const users = await userRepo.find({ status: "inactive" });
    return users || [];
  } catch (error) {
    throw new Error("Failed to fetch inactive users: " + error.message);
  }
};
export const removeUnacceptedUser = async (userId) => {
  try {
    const user = await userRepo.findOne({ _id: userId, status: "inactive" });
    if (!user) {
      throw new Error("User not found or already accepted");
    }

    await userRepo.deleteOne({ _id: userId });
    return { message: "User removed successfully" };
  } catch (error) {
    throw new Error("Failed to remove user: " + error.message);
  }
};
export const uploadProfileImage = async (req, res, next) => {
  try {
    const userId = req.user.id; // get from JWT middleware
    const user = await userRepo.findById(userId);

    console.log(req, "req");
    console.log(req.file, "req file");
    console.log(user, "user");
    console.log(userId, "user id ");
    if (!req.file) throw ApiError.badRequest(messages.FILE_NOT_UPLOADED);

    // If user already has an image, remove old one
    if (user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // Upload new image to cloudinary
    const result = await uploadToCloudinary(req.file.path, "user_avatars");

    // Update DB
    user.avatar = {
      url: result.secure_url,
      public_id: result.public_id,
      default_letter: null,
    };
    await user.save();

    // Remove temp file
    fs.unlinkSync(req.file.path);

    res.json({ message: "Profile image updated", avatar: user.avatar });
  } catch (err) {
    next(err);
  }
};
export const removeProfileImage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userRepo.findById(userId);

    // Delete image from Cloudinary if exists
    if (user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }


    const firstLetter = user.name.charAt(0).toUpperCase();

    // ✅ Generate avatar URL using UI Avatars (optional)
    const avatarUrl = `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff&size=128`;

    // Reset to default letter avatar
    user.avatar = {
      url: avatarUrl,
      public_id: null,
      default_letter: firstLetter,
    };

    await user.save();

    res.json({ message: "Profile image removed", avatar: user.avatar });
  } catch (err) {
    next(err);
  }
};
export const assignRole = async (id, newRoleName) => {
  const user = await userRepo.findById(id);
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);
  if (!newRoleName) throw ApiError.badRequest(messages.ROLE_NOT_DEFINE);

  // 🔑 Find role by name
  const role = await roleRepo.findOne({ name: newRoleName });
  if (!role) throw ApiError.notFound(messages.ROLE_NOT_FOUND);

  // ✅ Assign role ObjectId
  user.role_id = role._id;

  await user.save();
  return user;
};
export const deleteStatus = async (id) => {
  try {
    const user = await userRepo.findById(id);
    if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);

    if (user.status === "deleted") throw ApiError.badRequest(messages.USER_ALREADY_DELETED)

    // Optional password check (if you uncomment later)
    // const isMatch = await comparePassword(password, user.password)
    // if (!isMatch) throw ApiError.unauthorized(messages.PASSWORD_UNMATCH)

    // ✅ Update status to "deleted"
    user.status = "deleted";
    await user.save();

    // ✅ Optional socket notification (if you want to broadcast)
    // io.emit("user_status_deleted", {
    //   id: user._id,
    //   name: user.name,
    //   email: user.email,
    //   status: user.status,
    // });

    return {
      success: true,
      message: "User status updated to deleted successfully",
      data: user,
    };
  } catch (error) {
    console.error("Service deleteUserStatus Error:", error);
    return {
      success: false,
      message: error.message || "Error deleting user status",
    };
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
  removeUnacceptedUser,
  updateProfile,
  assignRole,
  deleteStatus,
  // googleSignup,
};

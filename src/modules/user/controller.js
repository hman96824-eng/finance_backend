import { successResponse } from "../../utils/response.helper.js";
import userService from "./service.js";
import { messages } from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";
import { tr } from "zod/locales";

// login
export const login = async (req, res, next) => {
  try {
    const data = await userService.login(req.body);
    res.setHeader("Authorization", `Bearer ${data.accessToken}`);

    return successResponse(res, data, messages.LOGIN_MESSAGE);
  } catch (err) {
    next(err);
  }
};
export const refreshToken = async (req, res, next) => {
  try {
    const data = await userService.refreshAccessToken(req.body);
    return successResponse(res, data, messages.ACCESS_TOKEN);
  } catch (err) {
    next(err);
  }
};
export const signup = async (req, res, next) => {
  try {
    const data = await userService.signup(req.body);
    return successResponse(res, data, messages.USER_CREATED);
  } catch (err) {
    next(err);
  }
};
//  forgetpassword request otp
export const forgetpassword = async (req, res, next) => {
  try {
    const data = await userService.forgetpassword(req.body);
    return successResponse(res, data, messages.OTP_SENT_MESSAGE);
  } catch (err) {
    next(err);
  }
};
// forgetpassword verifyOtp
export const verifyCode = async (req, res, next) => {
  try {
    const data = await userService.verifyCode(req.body);
    return successResponse(res, data, messages.VERIFIED_OTP);
  } catch (err) {
    next(err);
  }
};
// reset password
export const resetPassword = async (req, res, next) => {
  try {
    const data = await userService.resetPassword(req.body);
    return successResponse(res, data, messages.PASSWORD_RESET);
  } catch (err) {
    next(err);
  }
};
// changePassword requestOtp
export const requestOtp = async (req, res, next) => {
  try {
    if (req.body.email !== req.user.email) {
      throw ApiError.unauthorized(messages.AUTH_INVALID_EMAIL);
    }
    const data = await userService.forgetpassword(req.body);
    return successResponse(res, data, messages.OTP_SENT_MESSAGE);
  } catch (err) {
    next(err);
  }
};
// changePassword verifyOtp
export const verifyOtp = async (req, res, next) => {
  try {
    if (req.body.email !== req.user.email) {
      throw ApiError.unauthorized(messages.AUTH_INVALID_EMAIL);
    }
    const data = await userService.verifyCode(req.body);
    return successResponse(res, data, messages.OTP_VERIFIED);
  } catch (err) {
    next(err);
  }
};
// changePassword
export const changePassword = async (req, res, next) => {
  try {
    if (req.body.email !== req.user.email) {
      throw ApiError.unauthorized(messages.AUTH_INVALID_EMAIL);
    }
    const data = await userService.resetPassword(req.body);
    return successResponse(res, data, messages.PASSWORD_RESET_SUCCESS);
  } catch (err) {
    next(err);
  }
};

// =============  zeeshan =================

// ---------------- GET ALL USER  ----------------
export const getUser = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};
// ---------------- GET USER BY ID  ----------------
export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: messages.USER_NOT_FOUND });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
export const sendInvitation = async (req, res) => {
  try {
    console.log("check 4");

    const { email, role_id } = req.body;

    if (!email || !role_id) {
      return res
        .status(400)
        .json({ message: "Email and role_id are required." });
    }

    console.log("check 6");

    const invite = await userService.createInvite(email, role_id);

    res.status(201).json({
      message: "Invitation sent successfully and stored in DB.",
      data: {
        email: invite.email,
        role_id: invite.role_id,
        accepted: invite.accepted,
        inviteCount: invite.invite,
        expiresAt: invite.expiresAt,
      },
    });
    console.log("chcek 7");
  } catch (error) {
    console.error(error, "error");
    res.status(400).json({ message: error.message });
  }
};
// ---------------- USER REGISTRATION ----------------
export const completeRegistration = async (req, res) => {
  const { token } = req.query;
  const { email } = req.query;
  const { role } = req.query;

  if (!token) {
    return res.status(400).json({ message: messages.TOKEN_MISSING });
  }

  try {
    const result = await userService.registerUser(token, req.body);
    res.status(201).json({
      success: true,
      message: messages.SIGNUP_SUCCESS,
      ...result,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// ---------------- USER STATUS ----------------
export const toggleUserStatus = async (req, res) => {
  try {
    const result = await userService.toggleUserStatus(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || messages.USER_STATUS_UPDATE_FAILED });
  }
};
// ---------------- DASHBOARD ----------------
export const dashboard = (req, res) => {
  res.json({
    message: `Welcome, ${req.user.email}!`,
    role: req.user.role_id,
  });
};
// ---------------- DASHBOARD ----------------
export const getProfile = async (req, res) => {
  try {
    // Make sure req.user is set by the authenticate middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: messages.LOGIN_REQUIRED,
      });
    }
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: messages.USER_NOT_FOUND,
      });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        status: user.status,
        created_at: user.createdAt, // mongoose usually stores as createdAt
        updated_at: user.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const InactiveUserStatus = async (req, res) => {
  try {
    const inactiveUsers = await userService.getInactiveUsers();
    res.status(200).json({
      success: true,
      count: inactiveUsers.length,
      users: inactiveUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const RemoveUnacceptedUser = async (req, res) => {
  try {
    const { id } = req.params; // user ID from URL
    const result = await userService.removeUnacceptedUser(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const health = async (req, res) => {
  res.status(200).json({ success: true, message: "ok" });
};
export const googleSignup = async (req, res, next) => {
  try {
    const { email, name } = req.user; // from passport after Google login
    const { phone, role_id, password, confirmPassword } = req.body; // frontend form

    const newUser = await userService.googleSignup({
      email,
      name,
      phone,
      role_id,
      password,
      confirmPassword,
    });

    return successResponse(res, newUser, messages.USER_CREATED);
  } catch (err) {
    next(err);
  }
};

export default {
  login,
  signup,
  refreshToken,
  forgetpassword,
  verifyCode,
  resetPassword,
  requestOtp,
  verifyOtp,
  changePassword,
  // zeeshan
  getUser,
  getUserById,
  sendInvitation,
  toggleUserStatus,
  completeRegistration,
  dashboard,
  getProfile,
  InactiveUserStatus,
  RemoveUnacceptedUser,
  health,
  googleSignup,
};

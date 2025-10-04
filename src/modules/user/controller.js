import { successResponse } from "../../utils/response.helper.js";
import userService from "./service.js";
import { messages } from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";

export const login = async (req, res, next) => {
  try {
    const data = await userService.login(req.body);
    res.setHeader("Authorization", `Bearer ${data.accessToken}`);

    return successResponse(res, messages.LOGIN_MESSAGE, data,);
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
export const forgetpassword = async (req, res, next) => {
  try {
    const data = await userService.forgetpassword(req.body);
    return successResponse(res, data, messages.OTP_SENT_MESSAGE);
  } catch (err) {
    next(err);
  }
};
export const verifyCode = async (req, res, next) => {
  try {
    const data = await userService.verifyCode(req.body);
    return successResponse(res, data, messages.VERIFIED_OTP);
  } catch (err) {
    next(err);
  }
};
export const resetPassword = async (req, res, next) => {
  try {
    const data = await userService.resetPassword(req.body);
    return successResponse(res, data, messages.PASSWORD_RESET);
  } catch (err) {
    next(err);
  }
};
export const passowrdChange = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id;
    if (!userId) throw ApiError.notFound(messages.USER_NOT_FOUND);
    const data = await userService.passowrdChange(
      userId,
      currentPassword,
      newPassword,
      confirmNewPassword
    );
    return successResponse(res, data, messages.PASSWORD_RESET_SUCCESS);
  } catch (err) {
    next(err);
  }
};

// =============  zeeshan =================

export const getUser = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    if (!users) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Error in getUser:", err);
    next(err);
  }
};
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
export const getProfile = async (req, res) => {
  try {
    const userId = req?.user?.id;

    if (!req?.user || !userId) {
      return res.status(401).json({
        success: false,
        message: messages.LOGIN_REQUIRED,
      });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: messages.USER_NOT_FOUND,
      });
    }

    // ✅ Return user with populated role (no permissions)
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id, // populated without permissions
        status: user.status,
        salary: user.salary,
        address: user.address,
        gender: user.gender,
        nationality: user.nationality,
        maritalStatus: user.maritalStatus,
        department: user.department,
        description: user.description,
        avatar: user.avatar,
        created_at: user.createdAt,
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
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req?.user?.id;

    const updatedUser = await userService.updateProfile(userId, req.body);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: messages.USER_NOT_FOUND,
      });
    }

    // ✅ Return response in same structure (just role populated)
    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        status: updatedUser.status,
        role: updatedUser.role_id?.name || null,
        role_description: updatedUser.role_id?.description || null,
        address: updatedUser.address,
        gender: updatedUser.gender,
        nationality: updatedUser.nationality,
        maritalStatus: updatedUser.maritalStatus,
        department: updatedUser.department,
        salary: updatedUser.salary,
        description: updatedUser.description,
        avatar: updatedUser.avatar,
        created_at: updatedUser.createdAt,
        updated_at: updatedUser.updatedAt,
      },
    });
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
export const completeRegistration = async (req, res) => {
  const { token } = req.query;
  const { email } = req.query;
  const { role } = req.query;

  if (!token) {
    return res.status(400).json({ message: messages.TOKEN_MISSING });
  }

  try {
    const result = await userService.registerUser(token, role, req.body);
    res.status(201).json({
      success: true,
      message: messages.SIGNUP_SUCCESS,
      ...result,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
export const toggleUserStatus = async (req, res) => {
  try {
    const userID = req?.params?.id
    const result = await userService.toggleUserStatus(userID);
    res.json({ success: true, ...result });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || messages.USER_STATUS_UPDATE_FAILED });
  }
};
export const dashboard = (req, res) => {
  res.json({
    message: `Welcome, ${req.user.email}!`,
    role: req.user.role_id,
  });
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
export const changeRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newRoleName } = req.body;

    const updatedUser = await userService.assignRole(id, newRoleName);

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await userService.deleteStatus(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Delete User Error:", error);
    return res.status(500).json({
      success: false,
      message: messages.INTERNAL_SERVER_ERROR || "Internal Server Error",
    });
  }
};
export const health = async (req, res) => {
  res.status(200).json({ success: true, message: "ok" });
};


export default {
  login,
  signup,
  refreshToken,
  forgetpassword,
  verifyCode,
  resetPassword,
  passowrdChange,
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
  updateProfile,
  changeRole,
  deleteUserStatus,
  // googleSignup,
};

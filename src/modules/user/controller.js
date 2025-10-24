import { successResponse } from "../../utils/response.helper.js";
import userService from "./service.js";
import inviteservice from "../invites/service.js";
import { messages } from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";

export const login = async (req, res, next) => {
  try {
    const data = await userService.login(req.body);
    // set header for convenience
    res.setHeader("Authorization", `Bearer ${data.accessToken}`);

    return successResponse(res, messages.LOGIN_MESSAGE, data);
  } catch (err) {
    next(err);
  }
};

export const signup = async (req, res, next) => {
  try {
    const data = await userService.signup(req.body);
    return successResponse(res, messages.USER_CREATED, data, data.notification);
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
    const { status } = req.query;
    // Build filter based on query
    const filter = {};
    if (status && ["active", "inactive", "deleted"].includes(status)) {
      filter.status = status;
    }

    const users = await userService.getAllUsers(filter);

    if (!users) throw ApiError.notFound(messages.USER_NOT_FOUND);

    const totalActive = await userService.countUsersByStatus("active");
    const totalInctive = await userService.countUsersByStatus("inactive");
    const deletedUser = await userService.countUsersByStatus("deleted");
    const totalUsers = totalActive + totalInctive + deletedUser;
    res.json({
      success: true,
      totalUsers,
      totalActive,
      totalInctive,
      deletedUser,
      filtered: users.length,
      data: users,
    });
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

    // ✅ Return user with role (already sanitized in service)
    res.json({
      success: true,
      data: user,
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

    // Return sanitized user (service already filters)
    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const userID = req?.params?.id;
    const result = await userService.toggleUserStatus(userID);
    res.json({ success: true, ...result });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || messages.USER_STATUS_UPDATE_FAILED });
  }
};

export const dashboard = (req, res, next) => {
  res.json({
    message: `Welcome, ${req.user.email}!`,
    role: req.user.role_id,
  });
};

export const InactiveUserStatus = async (req, res, next) => {
  try {
    const inactiveUsers = await userService.getInactiveUsers();

    const transformedUsers = inactiveUsers.map((user) => {
      const userObj = user; // service returns plain objects already
      userObj.role_id = userObj.role || null;
      delete userObj.password; // just to be safe
      return userObj;
    });

    res.status(200).json({
      success: true,
      count: transformedUsers.length,
      users: transformedUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const ArchiveDeleteUsers = async (req, res) => {
  try {
    const { id } = req.params; // user ID from URL
    const result = await userService.archiveDeleteUser(id);

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

export const ArchiveDeleteMultipleUsers = async (req, res) => {
  try {
    const { ids } = req.body; // array of user IDs

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of user IDs.",
      });
    }

    const result = await userService.archiveDeleteMultipleUsers(ids);

    res.status(200).json({
      success: true,
      message: result.message,
      deletedCount: result.deletedCount,
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

export const deleteUserStatus = async (req, res, next) => {
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

// controllers/user.controller.js

export const DeleteMany = async (req, res, next) => {
  try {
    const userIds = req.body;
    const { type } = req.query;

    // Call appropriate service
    let result;
    if (type === "members") {
      result = await userService.softDeleteManyUsers(userIds);
    } else if (type === "invited") {
      result = await inviteservice.deleteManyInvitedUsers(userIds);
    } else if (type === "archived") {
      result = await userService.deleteManyArchivedUsers(userIds);
    }

    return successResponse(res, result, messages.USER_DELETED);
  } catch (err) {
    next(err);
  }
};

export const health = async (req, res) => {
  res.status(200).json({ success: true, message: "ok" });
};

export default {
  login,
  signup,
  forgetpassword,
  verifyCode,
  resetPassword,
  passowrdChange,
  // zeeshan
  getUser,
  getUserById,
  toggleUserStatus,
  dashboard,
  getProfile,
  InactiveUserStatus,
  ArchiveDeleteUsers,
  health,
  updateProfile,
  changeRole,
  deleteUserStatus,
  DeleteMany,
  ArchiveDeleteMultipleUsers,
  // googleSignup,
};

import { successResponse } from "../utils/response.helper.js";
import userService from "./service.js";
import { messages } from "../../constants/messages.js";
import ApiError from "../utils/ApiError.js";

// login
export const login = async (req, res, next) => {
  try {
    const data = await userService.login(req.body);
    res.setHeader("Authorization", `Bearer ${data.token}`);
    return successResponse(res, data, messages.LOGIN_MESSAGE);
  } catch (err) {
    next(err);
  }
};

// signup

export const signup = async (req, res, next) => {
  try {
    const data = await userService.signup(req.body);
    return successResponse(res, data, messages.REGISTER_MESSAGE);
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
      throw new ApiError(403, messages.AUTH_INVALID_EMAIL);
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
      throw new ApiError(403, messages.AUTH_INVALID_EMAIL);
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
      throw new ApiError(403, messages.AUTH_INVALID_EMAIL);
    }
    const data = await userService.resetPassword(req.body);
    return successResponse(res, data, messages.PASSWORD_RESET_SUCCESS);
  } catch (err) {
    next(err);
  }
};

export default {
  login,
  signup,
  forgetpassword,
  verifyCode,
  resetPassword,
  requestOtp,
  verifyOtp,
  changePassword,
};

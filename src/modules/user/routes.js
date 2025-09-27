import express from "express";
import userController from "./controller.js";
import { validate } from "../../middleware/validation.middleware.js";
import { auth } from "../../middleware/auth.js";
import {
  loginValidation,
  requestOTP,
  verifyOTP,
  resetpassword,
  registerValidation,
} from "./validation.js";
const router = express.Router();

router
  .post("/login", validate(loginValidation), userController.login)
  .post("/register", validate(registerValidation), userController.signup)
  .post("/forgetpassword", validate(requestOTP), userController.forgetpassword)
  .post("/verifyCode", validate(verifyOTP), userController.verifyCode)
  .post("/resetpassword", validate(resetpassword), userController.resetPassword)
  .post("/requestOTP", auth, validate(requestOTP), userController.requestOtp)
  .post("/verifyOtp", auth, validate(verifyOTP), userController.verifyOtp)
  .post(
    "/chnagepassword",
    auth,
    validate(resetpassword),
    userController.changePassword
  );

export default router;

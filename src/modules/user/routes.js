import express from "express";
import userController from "./controller.js";
import { validate } from "../../middleware/validation.middleware.js";
import { auth } from "../../middleware/auth.js";
import {
  loginValidation,
  requestOTP,
  verifyOTP,
  resetpassword,
} from "./validation.js";
const router = express.Router();

router
  .post("/login", validate(loginValidation), userController.login)
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

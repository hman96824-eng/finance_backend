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
  .post("/signup", validate(registerValidation), userController.signup)
  .post("/verifysignup", validate(verifyOTP), userController.verifySignup)
  .post(
    "/forgetPasswordOtp",
    validate(requestOTP),
    userController.forgetpassword
  )
  .post("/ForgetVerifyOtp", validate(verifyOTP), userController.verifyCode)
  .post(
    "/forgetPassword",
    validate(resetpassword),
    userController.resetPassword
  )
  .post(
    "/changePasswordOtp",
    auth,
    validate(requestOTP),
    userController.requestOtp
  )
  .post("/chnageVerifyOtp", auth, validate(verifyOTP), userController.verifyOtp)
  .post(
    "/changepassword",
    auth,
    validate(resetpassword),
    userController.changePassword
  );

export default router;

import express from "express";
import userController from "./controller.js";
import { validate } from "../../middleware/validation.middleware.js"
import validation from "../../validation/validation.js";
import middleware from '../../middleware/auth.middleware.js';

const router = express.Router();

router
  // asim
  .post("/signup", validate(validation.registerValidation), userController.signup)
  .post("/login", validate(validation.loginValidation), userController.login)
  .post("/refresh-token", userController.refreshToken)
  .post("/verifysignup", validate(validation.verifyOTP), userController.verifySignup)
  .post("/forgetPasswordOtp", validate(validation.requestOTP), userController.forgetpassword)
  .post("/ForgetVerifyOtp", validate(validation.verifyOTP), userController.verifyCode)
  .post("/forgetPassword", validate(validation.resetPassword), userController.resetPassword)
  .post("/changePasswordOtp", middleware.authenticate, validate(validation.requestOTP), userController.requestOtp)
  .post("/chnageVerifyOtp", middleware.authenticate, validate(validation.verifyOTP), userController.verifyOtp)
  .post("/changepassword", middleware.authenticate, validate(validation.resetPassword), userController.changePassword)
  // zeeshan
  .get("/", middleware.authenticate, middleware.AdminPermission, userController.getUser)
  .get("/health", userController.health)
  .get("/:id", middleware.authenticate, middleware.AdminPermission, validate(validation.idParam, "params"), userController.getUserById)
  .get("/profile", middleware.authenticate, userController.getProfile)
  // User's Status 
  .get("/inactive", middleware.authenticate, middleware.AdminPermission, userController.InactiveUserStatus)
  .delete("/remove/:id", middleware.authenticate, middleware.AdminPermission, userController.RemoveUnacceptedUser)
  .put("/:id", middleware.authenticate, validate(validation.idParam, "params"), validate(validation.toggleUserStatusValidation), middleware.AdminPermission, userController.toggleUserStatus)
  // Send Invitation 
  .post("/invite", middleware.authenticate, middleware.AdminPermission, validate(validation.inviteUserValidation), userController.sendInvitation)
  .post("/register", validate(validation.completeRegistrationValidation), userController.completeRegistration)
  .get("/dashboard", middleware.authenticate, userController.dashboard)



export default router;
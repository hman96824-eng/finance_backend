import express from "express";
import multer from "multer";
import service from "./service.js";
import userController from "./controller.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import middleware from "../../middleware/auth.middleware.js";
// import passport from "../../utils/passport.js";
import { checkPermission } from "../../middleware/permissons.js";
import { exportUsersExcel } from "../../config/excel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router
  .put("/upload-avatar", middleware.authenticate, upload.single("avatar"), service.uploadProfileImage)
  .delete("/remove-avatar", middleware.authenticate, service.removeProfileImage)
  .put("/profile", middleware.authenticate, userController.updateProfile)
  .put("/toggle-status/:id", middleware.authenticate, checkPermission(["manage_users"]), userController.toggleUserStatus)
  .put("/delete-status/:id", middleware.authenticate, checkPermission(["manage_users"]), userController.deleteUserStatus)
  .get("/profile", middleware.authenticate, userController.getProfile)
  .post("/signup", validate(validation.registerValidation), userController.signup)
  .get("/inactive", middleware.authenticate, checkPermission(["manage_users"]), userController.InactiveUserStatus)
  .post("/login", validate(validation.loginValidation), userController.login)

  .post("/forgetPasswordOtp", validate(validation.requestOTP), userController.forgetpassword)
  .post("/ForgetVerifyOtp", validate(validation.verifyOTP), userController.verifyCode)
  .post("/forgetPassword", validate(validation.resetPassword), userController.resetPassword)

  .post("/passwordChange", middleware.authenticate, validate(validation.passwordChange), userController.passowrdChange)
  .get("/", middleware.authenticate, checkPermission(["view_users"]), userController.getUser)
  .get("/:id", middleware.authenticate, checkPermission(["view_users"]), userController.getUserById)
  .get("/health", userController.health)

  // User's Status
  .delete("/remove/:id", middleware.authenticate, checkPermission(["view_users"]), userController.RemoveUnacceptedUser)
  // Send Invitation
  .post("/invite", middleware.authenticate, checkPermission(["view_users"]), validate(validation.inviteUserValidation), userController.sendInvitation)
  .post("/register", validate(validation.completeRegistrationValidation), userController.completeRegistration)
  .get("/dashboard", middleware.authenticate, userController.dashboard)
  .put("/change-role/:id", middleware.authenticate, checkPermission(["assign_roles"]), userController.changeRole)

  // export data in excel file 
  .get("/export/excel", middleware.authenticate, checkPermission(["view_users"]), exportUsersExcel)

export default router;

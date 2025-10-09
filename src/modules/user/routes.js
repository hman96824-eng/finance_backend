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
  .put("/upload-avatar", middleware.authenticate, upload.single("avatar"), service.uploadProfileImage) // upload the dp photo 
  .delete("/remove-avatar", middleware.authenticate, service.removeProfileImage) // remove the dp photo
  .put("/profile", middleware.authenticate, checkPermission(["update_own_profile"]), userController.updateProfile) // update owen profile 
  .put("/toggle-status/:id", middleware.authenticate, checkPermission(["manage_users"]), userController.toggleUserStatus) // toggle user status
  .put("/delete-status/:id", middleware.authenticate, checkPermission(["manage_users"]), userController.deleteUserStatus) // soft delete user
  .get("/profile", middleware.authenticate, checkPermission(["view_own_profile"]), userController.getProfile) // get owen profile
  .post("/signup", validate(validation.registerValidation), userController.signup)
  .get("/inactive", middleware.authenticate, checkPermission(["view_users"]), userController.InactiveUserStatus) // all InActive user's
  .post("/login", validate(validation.loginValidation), userController.login)
  .post("/forgetPasswordOtp", validate(validation.requestOTP), userController.forgetpassword)
  .post("/ForgetVerifyOtp", validate(validation.verifyOTP), userController.verifyCode)
  .post("/forgetPassword", validate(validation.resetPassword), userController.resetPassword)

  .post("/passwordChange", middleware.authenticate, validate(validation.passwordChange), checkPermission(["change_password"]), userController.passowrdChange)
  .get("/", middleware.authenticate, checkPermission(["view_users"]), userController.getUser) // get all user 
  .get("/:id", middleware.authenticate, checkPermission(["view_users"]), userController.getUserById) // get user by ID
  .get("/health", userController.health)
  // User's Status
  .delete("/remove/:id", middleware.authenticate, checkPermission(["manage_users"]), userController.RemoveUnacceptedUser) // unaccepted user
  // Send Invitation
  .get("/dashboard", middleware.authenticate, userController.dashboard)
  // routes
  .put("/change-role/:id", middleware.authenticate, checkPermission(["manage_users"]), userController.changeRole) // change the user role

  // export data in excel file 
  .get("/export/excel", middleware.authenticate, checkPermission(["view_users"]), exportUsersExcel) // export the all user data in excel file



export default router;

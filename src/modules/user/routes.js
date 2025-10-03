import express from "express";
import multer from "multer";
import service from "./service.js";
import userController from "./controller.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import middleware from "../../middleware/auth.middleware.js";
// import passport from "../../utils/passport.js";
import { checkPermission } from "../../middleware/permissons.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router
  .put("/:id", middleware.authenticate, validate(validation.idParam, "params"), validate(validation.toggleUserStatusValidation), checkPermission(["manage_users"]), userController.toggleUserStatus)
  .get("/profile", middleware.authenticate, userController.getProfile)
  .put("/profile", middleware.authenticate, userController.updateProfile)
  .post(
    "/signup",
    validate(validation.registerValidation),
    userController.signup
  )
  // .get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
  .put(
    "/upload-avatar",
    middleware.authenticate,
    upload.single("avatar"),
    service.uploadProfileImage
  )
  .delete("/remove-avatar", middleware.authenticate, service.removeProfileImage)
  .get(
    "/inactive",
    middleware.authenticate,
    middleware.AdminPermission,
    userController.InactiveUserStatus
  )
  // asim
  .post("/login", validate(validation.loginValidation), userController.login)
  .post("/refresh-token", userController.refreshToken)

  .post("/forgetPasswordOtp", validate(validation.requestOTP), userController.forgetpassword)
  .post("/ForgetVerifyOtp", validate(validation.verifyOTP), userController.verifyCode)
  .post("/forgetPassword", validate(validation.resetPassword), userController.resetPassword)
  .post("/changePasswordOtp", middleware.authenticate, validate(validation.requestOTP), userController.requestOtp)
  .post("/chnageVerifyOtp", middleware.authenticate, validate(validation.verifyOTP), userController.verifyOtp)
  .post("/changepassword", middleware.authenticate, validate(validation.resetPassword), userController.changePassword)
  // Profile
  .get("/", middleware.authenticate, checkPermission(["view_users"]), userController.getUser)
  .get("/:id", middleware.authenticate, checkPermission(["view_users"]), userController.getUserById)
  .get("/health", userController.health)

  // User's Status
  .delete("/remove/:id", middleware.authenticate, checkPermission(["view_users"]), userController.RemoveUnacceptedUser)
  // Send Invitation
  .post(
    "/invite",
    middleware.authenticate,
    checkPermission(["view_users"]),
    validate(validation.inviteUserValidation),
    userController.sendInvitation
  )
  .post(
    "/register",
    validate(validation.completeRegistrationValidation),
    userController.completeRegistration
  )
  .get("/dashboard", middleware.authenticate, userController.dashboard);

// Step 1 - redirect to Google
// Step 2 - callback
// .get("/google/callback", passport.authenticate("google", { session: false }), userController.googleSignup);

export default router;

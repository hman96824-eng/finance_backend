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
import controller from "./controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router
  .post("/login", validate(validation.loginValidation), userController.login)
  .get("/health", userController.health)
  .post(
    "/forgetPasswordOtp",
    validate(validation.requestOTP),
    userController.forgetpassword
  )
  .post(
    "/ForgetVerifyOtp",
    validate(validation.verifyOTP),
    userController.verifyCode
  )
  .post(
    "/forgetPassword",
    validate(validation.resetPassword),
    userController.resetPassword
  )
  .post(
    "/signup",
    validate(validation.registerValidation),
    userController.signup
  )
  .post(
    "/passwordChange",
    validate(validation.passwordChange),
    userController.passowrdChange
  );

router.use(middleware.authenticate);

router
  .put("/deleteMany", userController.DeleteMany)
  .put("/upload-avatar", upload.single("avatar"), service.uploadProfileImage) // upload the dp photo
  .delete("/remove-avatar", service.removeProfileImage) // remove the dp photo
  // update own profile
  .put("/profile", userController.updateProfile)
  .put("/delete-status/:id", userController.deleteUserStatus) // soft delete user
  .get("/profile", userController.getProfile) // get owen profile
  // unaccepted multiple users
  .get("/dashboard", userController.dashboard);

// export the all user data in excel file

router
  .use(checkPermission(["view_users"]))
  .get("/", userController.getUser)
  .get("/inactive", userController.InactiveUserStatus)
  .get("/", userController.getUser)
  .get("/:id", userController.getUserById)
  .get("/export/excel", exportUsersExcel); // get all user
router
  .use(checkPermission(["manage_users"]))
  .put("/toggle-status/:id", userController.toggleUserStatus)
  .delete("/remove/:id", userController.ArchiveDeleteUsers)
  .delete(
    "/remove-multiple-archive",
    userController.ArchiveDeleteMultipleUsers
  );

router
  .use(checkPermission(["assign_roles"]))
  .put("/change-role/:id", userController.changeRole);
export default router;

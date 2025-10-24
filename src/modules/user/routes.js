// import express from "express";
// import multer from "multer";
// import service from "./service.js";
// import userController from "./controller.js";
// import { validate } from "../../middleware/validation.middleware.js";
// import validation from "../../validation/validation.js";
// import middleware from "../../middleware/auth.middleware.js";
// // import passport from "../../utils/passport.js";
// import { checkPermission } from "../../middleware/permissons.js";
// import { exportUsersExcel } from "../../config/excel.js";
// import controller from "./controller.js";

// const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// // public routes
// router
//   .post("/login", validate(validation.loginValidation), userController.login) // login
//   .get("/health", userController.health)
//   .post(
//     "/forgetPasswordOtp",
//     validate(validation.requestOTP),
//     userController.forgetpassword
//   ) // request otp for forget password \
//   .post(
//     "/ForgetVerifyOtp",
//     validate(validation.verifyOTP),
//     userController.verifyCode
//   ) // verify otp for forget password
//   .post(
//     "/forgetPassword",
//     validate(validation.resetPassword),
//     userController.resetPassword
//   ) // reset password
//   .post(
//     "/signup",
//     validate(validation.registerValidation),
//     userController.signup
//   ) // register user
//   .post(
//     "/passwordChange",
//     validate(validation.passwordChange),
//     userController.passowrdChange
//   ); // change password

// // jwt authentication for routes below
// router.use(middleware.authenticate);

// // routes need jwt authentication
// router
//   .put("/deleteMany", userController.DeleteMany) // delete multiple users
//   .put("/upload-avatar", upload.single("avatar"), service.uploadProfileImage) // upload dp photo
//   .delete("/remove-avatar", service.removeProfileImage) // remove the dp photo
//   .put("/profile", userController.updateProfile) // update own profile
//   .get("/profile", userController.getProfile) // get own profile
//   .get("/dashboard", userController.dashboard);

// router
//   .use(checkPermission(["view_users"]))
//   .get("/", userController.getUser) // get all users
//   .get("/inactive", userController.InactiveUserStatus) // get inactive users
//   .get("/:id", userController.getUserById) // get user by id
//   .get("/export/excel", exportUsersExcel); // export users to excel

// router
//   .use(checkPermission(["manage_users"]))
//   .put("/toggle-status/:id", userController.toggleUserStatus) // activate/deactivate user
//   .delete("/remove/:id", userController.ArchiveDeleteUsers) // hard delete user
//   .put("/delete-status/:id", userController.deleteUserStatus); // soft delete user

// router
//   .use(checkPermission(["assign_roles"]))
//   .put("/change-role/:id", userController.changeRole); // change user role
// export default router;

import express from "express";
import multer from "multer";
import service from "./service.js";
import userController from "./controller.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";
import { exportUsersExcel } from "../../config/excel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// PUBLIC ROUTES

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

// AUTHENTICATED ROUTES

router.use(middleware.authenticate);

// Basic user self operations
router
  .put("/upload-avatar", upload.single("avatar"), service.uploadProfileImage)
  .delete("/remove-avatar", service.removeProfileImage)
  .put("/profile", userController.updateProfile)
  .get("/profile", userController.getProfile)
  .get("/dashboard", userController.dashboard);

// GROUPED PERMISSION ROUTES

// 🟦 VIEW USERS PERMISSION
const viewRouter = express.Router();
viewRouter.use(checkPermission(["view_users"]));

viewRouter
  .get("/", userController.getUser)
  .get("/:id", userController.getUserById)
  .get("/inactive", userController.InactiveUserStatus)
  .get("/export/excel", exportUsersExcel);

router.use("/view", viewRouter);

// 🟧 MANAGE USERS PERMISSION
const manageRouter = express.Router();
manageRouter.use(checkPermission(["manage_users"]));

manageRouter
  .put("/deleteMany", userController.DeleteMany)
  .put("/toggle-status/:id", userController.toggleUserStatus)
  .delete("/remove/:id", userController.ArchiveDeleteUsers)
  .put("/delete-status/:id", userController.deleteUserStatus);

router.use("/manage", manageRouter); // URLs remain unchanged

// 🟥 ASSIGN ROLES PERMISSION
const assignRouter = express.Router();
assignRouter.use(checkPermission(["assign_roles"]));

assignRouter.put("/change-role/:id", userController.changeRole);

router.use("/assign", assignRouter);

export default router;

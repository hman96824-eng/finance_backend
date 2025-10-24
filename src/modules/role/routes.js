import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import roleController from "./controller.js";

const router = express.Router();
router.use(middleware.authenticate);

const viewRouter = express.Router();
viewRouter
  .get("/", roleController.getAllRoles)
  .get("/:id", roleController.getRoleById);
router.use("/view", checkPermission(["view_users"]), viewRouter);

const manageRouter = express.Router();
console.log("Setting up role management routes");
manageRouter
  .post("/add", validate(validation.addRoleValidation), roleController.addRole) // add role
  .put("/update/:id", roleController.updateRole) // update role permissions
  .delete("/delete/:id", roleController.deleteRole) // delete role
  .put("/update-roleinfo/:id", roleController.updateRoleInfo); // update role info
router.use("/manage", checkPermission(["assign_roles"]), manageRouter);
export default router;

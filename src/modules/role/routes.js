import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import roleController from "./controller.js";

const router = express.Router();

router.use(middleware.authenticate);
router
  .use(checkPermission(["view_users"]))
  .get("/", roleController.getAllRoles) // get all roles
  .get("/:id", roleController.getRoleById); // get role by id
router
  .use(checkPermission(["assign_roles"]))
  .post("/add", validate(validation.addRoleValidation), roleController.addRole) // add role
  .put("/update/:id", roleController.updateRole) // update role permissions
  .delete("/delete/:id", roleController.deleteRole) // delete role
  .put("/update-roleinfo/:id", roleController.updateRoleInfo); // update role info

export default router;

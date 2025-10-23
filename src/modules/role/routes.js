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
  .get("/", roleController.getAllRoles);
router
  .use(checkPermission(["assign_roles"]))
  .post("/add", validate(validation.addRoleValidation), roleController.addRole)
  .put("/update/:id", roleController.updateRole)
  .delete("/delete/:id", roleController.deleteRole)
  .get("/:id", roleController.getRoleById)
  .put("/update-roleinfo/:id", roleController.updateRoleInfo);

export default router;

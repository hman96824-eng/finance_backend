import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import roleController from "./controller.js";

const router = express.Router();

router
    .get("/", middleware.authenticate, checkPermission(["view_users"]), roleController.getAllRoles)
    .post("/add", middleware.authenticate, checkPermission(["assign_roles"]), validate(validation.addRoleValidation), roleController.addRole)
    .put("/update/:id", middleware.authenticate, checkPermission(["assign_roles"]), roleController.updateRole)
    .delete("/delete/:id", middleware.authenticate, checkPermission(["assign_roles"]), roleController.deleteRole)


export default router;

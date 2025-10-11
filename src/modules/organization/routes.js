import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import roleController from "./controller.js";

const router = express.Router();

router;
router.post(
  "/organization",
  middleware.authenticate,
  validate(createOrganizationValidation),
  organizationController.createOrganization
);

export default router;

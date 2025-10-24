import express from "express";
import inviteController from "./controller.js";
import middleware from "../../middleware/auth.middleware.js";
import validation from "../../validation/validation.js";
import { checkPermission } from "../../middleware/permissons.js";
import { validate } from "../../middleware/validation.middleware.js";
import inviteService from "./service.js";

const router = express.Router();

router
  .get(
    "/invited-users",
    middleware.authenticate,
    checkPermission(["view_users"]),
    inviteController.getAllInvitedUsers
  )
  .post(
    "/invite",
    middleware.authenticate,
    checkPermission(["manage_users"]),
    validate(validation.inviteUserValidation),
    inviteController.sendInvitation
  )
  .post(
    "/register",
    validate(validation.completeRegistrationValidation),
    inviteController.completeRegistration
  )
  .put(
    "/status-delete/:id",
    middleware.authenticate,
    checkPermission(["manage_users"]),
    inviteController.updateInviteStatus
  );

export default router;

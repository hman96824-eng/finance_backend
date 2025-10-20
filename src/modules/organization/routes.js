import OrgController from './controller.js';
import express from 'express'
import middleware from '../../middleware/auth.middleware.js'
import upload from "../../middleware/upload.middleware.js"
import { checkPermission } from '../../middleware/permissons.js';
import { validate } from '../../middleware/validation.middleware.js';
import validation from '../../validation/validation.js';
import parseFormFields from '../../middleware/parseFormFields.middleware.js';

const router = express.Router()

router
    .post(
        "/add",
        middleware.authenticate,
        upload.single("avatar"),
        parseFormFields,
        checkPermission(["manage_system_settings"]),
        OrgController.createOrUpdateOrganization
    )
    .get("/", middleware.authenticate, OrgController.getLatestOrganization);

export default router;

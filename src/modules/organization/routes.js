import OrgController from './controller.js';
import express from 'express'
import middleware from '../../middleware/auth.middleware.js'
import { checkPermission } from '../../middleware/permissons.js';
import { validate } from '../../middleware/validation.middleware.js';
import validation from '../../validation/validation.js';

const router = express.Router()

router
    .post('/add', middleware.authenticate, validate(validation.organizationValidation), checkPermission(['manage_system_settings']), OrgController.createOrUpdateOrganization)
    .get('/', middleware.authenticate, OrgController.getAllOrganizations)
    .get('/:id', middleware.authenticate, OrgController.getOrganization)
    .delete('/:id', middleware.authenticate, checkPermission(['manage_system_settings']), OrgController.deleteOrganization)
    .put("/:id", middleware.authenticate, validate(validation.organizationValidation), checkPermission(['manage_system_settings']), OrgController.updateOrganization);

export default router;

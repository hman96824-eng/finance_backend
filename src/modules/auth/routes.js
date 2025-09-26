import express from 'express';
import * as authController from './controller.js';
import middleware from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/users', authController.getUser)
    .get('/users/:id', authController.getUserById)
    .get('/profile', middleware.authenticate, authController.getUserById) // Get own profile
    .put('/profile', middleware.authenticate, authController.toggleUserStatus) // Update own profile
    .get('/role', middleware.authenticate,) // Get own role
    .patch('/users/:id/role', middleware.authenticate, middleware.rolePermission, authController.toggleUserStatus) // Update user role
    .put('/users/:id', authController.toggleUserStatus)
    .post('/invite', middleware.authenticate, middleware.invitePermission, authController.sendInvitation)
    .delete('/invite/:id', middleware.authenticate, middleware.invitePermission, authController.toggleUserStatus) // Revoke invitation
    .get('/verify', authController.verifyToken)
    .post('/auth/register', authController.completeRegistration)
    .get('/dashboard', middleware.authenticate, authController.dashboard);

export default router;

import express from 'express';
import * as authController from './controller.js';
import middleware from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/auth/login', middleware.loginLimiter, authController.loginUser)
    .post('/auth/logout', middleware.authenticate, authController.logoutUser)
    .get('/users', middleware.authenticate, middleware.invitePermission, authController.getUser) // Get all users
    .get('/users/:id', middleware.authenticate, middleware.invitePermission, authController.getUserById) // Get user by ID
    .put('/users/:id', middleware.authenticate, authController.toggleUserStatus) // Update user status (active/inactive)
    .post('/invite', middleware.authenticate, middleware.invitePermission, authController.sendInvitation)
    .get('/verify', middleware.authenticate, authController.verifyToken)
    .post('/auth/register', authController.completeRegistration)
    .get('/dashboard', middleware.authenticate, authController.dashboard)
    .get('/auth/profile', middleware.authenticate, authController.getProfile) // Get own profile
// .delete('/invite/:id', middleware.authenticate, middleware.invitePermission, authController.toggleUserStatus) // Revoke invitation
// .patch('/users/:id/role', middleware.authenticate, middleware.rolePermission, authController.toggleUserStatus) // Update user role
// .put('/profile', middleware.authenticate, authController.toggleUserStatus) // Update own profile
// .get('/role', middleware.authenticate,) // Get own role

export default router;

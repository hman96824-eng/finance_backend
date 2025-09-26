
import authService from './service.js'
import tokenUtils from '../../utils/token.js';
import Messages from '../../constants/messages.js';

// ---------------- GET ALL USER  ----------------
export const getUser = async (req, res, next) => {
    try {
        const users = await authService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};
// ---------------- GET USER BY ID  ----------------
export const getUserById = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: Messages.USER_NOT_FOUND });
        }
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};
// ---------------- SEND INVITATION ----------------
export const sendInvitation = async (req, res) => {
    try {
        const { email, role_id } = req.body;
        const result = await authService.createInvite(email, role_id);
        if (result.token) {
            res.setHeader('Authorization', `Bearer ${result.token}`);
        }
        res.status(200).json({ success: true, message: Messages.INVITE_SENT, ...result });
    } catch (err) {
        res.status(400).json({ message: Messages.INVITE_FAILED, error: err.message });
    }
};
// ---------------- VERIFY TOKEN ----------------
export const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: Messages.TOKEN_MISSING });
        }

        const token = authHeader.split(' ')[1];
        const decoded = authService.verifyInviteToken(token);

        res.json({ valid: true, email: decoded.email, role_id: decoded.role_id });
    } catch (err) {
        res.status(400).json({ message: Messages.TOKEN_EXPIRED });
    }
};
// ---------------- USER REGISTRATION ----------------
export const completeRegistration = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: Messages.TOKEN_MISSING });
    }
    const token = authHeader.split(' ')[1];

    try {
        const result = await authService.registerUser(token, req.body);
        res.status(201).json({ success: true, message: Messages.SIGNUP_SUCCESS, ...result });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
// ---------------- USER STATUS ----------------
export const toggleUserStatus = async (req, res) => {
    try {
        const result = await authService.toggleUserStatus(req.params.id);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(400).json({ message: err.message || Messages.USER_STATUS_UPDATE_FAILED });
    }
};
// ---------------- DASHBOARD ----------------
export const dashboard = (req, res) => {
    res.json({
        message: `Welcome, ${req.user.email}!`,
        role: req.user.role_id,
    });
}

export default {
    getUser,
    getUserById,
    sendInvitation,
    verifyToken,
    toggleUserStatus,
    completeRegistration,
    dashboard
}
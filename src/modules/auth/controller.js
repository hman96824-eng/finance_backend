
import authService from './service.js'
import tokenUtils from '../../utils/token.js';
import Messages from '../../constants/messages.js';

// ---------------- LOGIN USER  ----------------
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: Messages.MISSING_CREDENTIALS });
    }
    try {
        // 🔹 Use service for authentication
        const user = await authService.authlogin(email, password);
        // 🔹 Generate JWT Token
        const authToken = tokenUtils.generateToken(
            { id: user._id, email: user.email, role_id: user.role_id },
            process.env.JWT_EXPIRES_IN || '7d'
        );
        // Set token in Response Header
        res.setHeader("Authorization", `Bearer ${authToken}`);

        return res.json({
            success: true,
            message: Messages.LOGIN_SUCCESS,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role_id: user.role_id,
            },
            token: authToken
        });

    } catch (err) {
        return res.status(401).json({ message: err.message || Messages.LOGIN_FAILED });
    }
};
// ---------------- LOGOUT USER  ----------------
export const logoutUser = async (req, res) => {
    try {
        // Clear token from header
        res.setHeader('Authorization', '');
        return res.json({
            success: true,
            message: Messages.LOGOUT_SUCCESS
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
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

        if (!email || !role_id) {
            return res.status(400).json({ message: "Email and role_id are required." });
        }

        const invite = await authService.createInvite(email, role_id);

        res.status(201).json({
            message: "Invitation sent successfully and stored in DB.",
            data: {
                email: invite.email,
                role_id: invite.role_id,
                accepted: invite.accepted,
                inviteCount: invite.invite,
                expiresAt: invite.expiresAt,
            },
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// ---------------- VERIFY TOKEN ----------------
export const verifyToken = async (req, res) => {
    try {
        // Get token from query parameter
        const token = req.query.token;

        if (!token) {
            return res.status(400).json({ message: "Token is missing" });
        }

        // Call service (checks DB only)
        const invite = await authService.verifyInviteToken(token);

        res.json({
            valid: true,
            email: invite.email,
            role_id: invite.role_id,
        });
    } catch (err) {
        res.status(400).json({ message: err.message || "Invalid or expired token" });
    }
};

// ---------------- USER REGISTRATION ----------------
export const completeRegistration = async (req, res) => {
    const { token } = req.query; // ✅ token comes from query parameter

    if (!token) {
        return res.status(400).json({ message: Messages.TOKEN_MISSING });
    }

    try {
        const result = await authService.registerUser(token, req.body);
        res.status(201).json({
            success: true,
            message: Messages.SIGNUP_SUCCESS,
            ...result,
        });
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
// ---------------- DASHBOARD ----------------
export const getProfile = async (req, res) => {
    try {
        // Make sure req.user is set by the authenticate middleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: Messages.LOGIN_REQUIRED
            });
        }
        const user = await authService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: Messages.USER_NOT_FOUND
            });
        }
        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id,
                status: user.status,
                created_at: user.createdAt, // mongoose usually stores as createdAt
                updated_at: user.updatedAt
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


export default {
    loginUser,
    getUser,
    getUserById,
    sendInvitation,
    verifyToken,
    toggleUserStatus,
    completeRegistration,
    dashboard,
    getProfile,
}
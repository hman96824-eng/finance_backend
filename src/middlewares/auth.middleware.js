import jwt from 'jsonwebtoken';
import Messages from '../constants/messages.js';

// ==================== AUTHENTICATE Middleware ====================
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: Messages.TOKEN_MISSING });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role_id: decoded.role_id,
        };
        next();
    } catch (err) {
        return res.status(403).json({ message: Messages.TOKEN_INVALID });
    }
};

// ==================== Invite Permission Middleware ====================
export const invitePermission = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: Messages.LOGIN_REQUIRED });
    }

    if (req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ message: Messages.UNAUTHORIZED });
    }

    next();
};

export default {
    authenticate,
    invitePermission,
};
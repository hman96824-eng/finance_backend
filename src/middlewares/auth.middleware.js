import jwt from 'jsonwebtoken';
import Messages from '../constants/messages.js';

// ==================== LOGIN RATE LIMITER ====================
export const loginLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    if (!loginLimiter.attempts) {
        loginLimiter.attempts = {};
    }
    if (!loginLimiter.attempts[ip]) {
        loginLimiter.attempts[ip] = [];
    }
    // Remove attempts older than 15 minutes
    loginLimiter.attempts[ip] = loginLimiter.attempts[ip].filter(timestamp => now - timestamp < 15 * 60 * 1000);
    if (loginLimiter.attempts[ip].length >= 5) {
        return res.status(429).json({ message: Messages.TOO_MANY_REQUESTS });
    }
    loginLimiter.attempts[ip].push(now);
    next();
};
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

    if (!req.user.role_id || req.user.role_id.toLowerCase() !== 'admin') {
        return res.status(403).json({ message: Messages.UNAUTHORIZED });
    }

    next();
};

export default {
    loginLimiter,
    authenticate,
    invitePermission,
};
import jwt from 'jsonwebtoken';
import messages from '../constants/messages.js';

// ==================== AUTHENTICATE Middleware ====================
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({ message: messages.TOKEN_MISSING });
        }

        const token = authHeader.split(' ')[1];


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role_id: decoded.role,
        };
        next();
    } catch (err) {
        return res.status(403).json({ message: messages.TOKEN_INVALID });
    }
};
// ==================== Invite Permission Middleware ====================
export const AdminPermission = (req, res, next) => {
    try {


        if (!req.user) {
            return res.status(401).json({ message: messages.LOGIN_REQUIRED });
        }
        console.log("check 1");
        console.log(req.user.role_id, "cdsbuivbi");


        if (!req?.user?.role_id || req?.user?.role_id?.toLowerCase() !== 'admin') {
            return res.status(403).json({ message: messages.UNAUTHORIZED });
            console.log("check 2");

        }
        console.log("check 3 ispresission");


        next();
    }
    catch (error) {
        return res.status(403).json({ message: messages.TOKEN_INVALID });

    }
};

export default {
    authenticate,
    AdminPermission,
};
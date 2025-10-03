import jwtHelper from "../utils/jwt.helper.js";
import messages from "../constants/messages.js";
import ApiError from "../utils/ApiError.js";

// ==================== AUTHENTICATE Middleware ====================
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: messages.TOKEN_MISSING });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwtHelper.verifyToken(token, process.env.JWT_SECRET);
    console.log(decoded, "decodededede");
    if (!decoded.id || !decoded.role)
      throw ApiError.unauthorized(messages.TOKEN_INVALID);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role_id: decoded.role_id,
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

    if (!req?.user?.role_id || req?.user?.role_id?.toLowerCase() !== "admin") {
      return res.status(403).json({ message: messages.UNAUTHORIZED });
    }
    next();
  } catch (error) {
    return res.status(403).json({ message: messages.TOKEN_INVALID });
  }
};

export default {
  authenticate,
  AdminPermission,
};

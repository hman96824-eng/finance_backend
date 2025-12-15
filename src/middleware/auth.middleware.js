import jwtHelper from "../utils/jwt.helper.js";
import messages from "../constants/messages.js";
import ApiError from "../utils/ApiError.js";

// ==================== AUTHENTICATE Middleware ====================
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer"))
      throw ApiError.unauthorized(messages.TOKEN_INVALID);

    const token = authHeader.split(" ")[1];

    const decoded = jwtHelper.verifyToken(token, process.env.JWT_SECRET);
    if (!decoded.id || !decoded.role)
      throw ApiError.unauthorized(messages.TOKEN_INVALID);

    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role_id: decoded.role_id,
    };
    next();
  } catch (err) {
    next(err);
  }
};


export const checkMonthClosed = async (req, res, next) => {
  try {
    
    const { month } = req.body; 

    if (!month) throw ApiError.badRequest("Month is required");

    const result = await db.query(
      "SELECT is_closed FROM closed_months WHERE month = ?",
      [month]
    );

    if (result.length > 0 && result[0].is_closed) {
      throw ApiError.forbidden(messages.MONTH_CLOSED || "This month is closed. Data cannot be edited.");
    }

    next(); // Month is open, allow operation
  } catch (err) {
    next(err);
  }
};



export default {
  authenticate,
  checkMonthClosed,
};

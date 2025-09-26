import ApiError from "../modules/utils/ApiError.js";
import { messages } from "../constants/messages.js";
import { verifyToken } from "../modules/utils/jwt.helper.js";

export const auth = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, messages.AUTH_TOKEN_REQUIRED);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role_id,
    };

    next();
  } catch (err) {
    next(new ApiError(401, messages.AUTH_INVALID_TOKEN));
  }
};

export default auth;

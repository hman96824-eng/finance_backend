import { config } from "../../config/config.js";
import jwt from "jsonwebtoken";
// generateToken
export const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "1d" });
};
// verifyToken
export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

export default {
  generateToken,
  verifyToken,
};

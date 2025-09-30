import { config } from "../config/config.js";
import jwt from "jsonwebtoken";

// generateToken
export const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_EXPIRES_IN || "20m",
  });
};
// refresh token
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_EXPIRES_IN || "7d",
  }); // long lived
};
// verifyToken
export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
};

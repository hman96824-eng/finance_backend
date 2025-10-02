import { config } from "../config/config.js";
import jwt from "jsonwebtoken";

// generateToken
export const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_EXPIRES_IN || "2d",
  });
};
// refresh token
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_EXPIRES_IN || "7d",
  }); // long lived
};
// verifyToken
export const verifyToken = (token, secret = config.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
};

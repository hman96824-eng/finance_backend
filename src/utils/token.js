import jwt from 'jsonwebtoken';

export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export default {
  generateToken,
  verifyToken
}


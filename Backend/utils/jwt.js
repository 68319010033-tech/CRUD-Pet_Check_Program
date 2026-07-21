const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'petcheck-access-secret';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'petcheck-refresh-secret';
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateAccessToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email },
    accessSecret,
    { expiresIn: accessExpiresIn }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { userId: user.id },
    refreshSecret,
    { expiresIn: refreshExpiresIn }
  );

const verifyAccessToken = (token) => jwt.verify(token, accessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

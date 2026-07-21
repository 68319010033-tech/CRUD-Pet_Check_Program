const { User } = require('../models');
const { verifyAccessToken } = require('../utils/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid token or inactive account.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;

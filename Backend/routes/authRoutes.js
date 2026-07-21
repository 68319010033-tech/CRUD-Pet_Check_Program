const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Profile } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

const router = express.Router();

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await user.update({ refresh_token: refreshToken });

  return { accessToken, refreshToken };
};

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password_hash,
    });

    await Profile.create({
      user_id: user.id,
      display_name: display_name || email.split('@')[0],
    });

    const tokens = await issueTokens(user);

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Login and receive JWT
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const tokens = await issueTokens(user);

    res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active || user.refresh_token !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// @desc    Logout and revoke refresh token
// @route   POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await req.user.update({ refresh_token: null });

    res.status(200).json({ message: 'Logout successful.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

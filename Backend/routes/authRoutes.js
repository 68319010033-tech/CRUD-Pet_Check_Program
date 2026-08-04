const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  User,
  Profile,
  EmailVerificationToken,
  PasswordResetToken,
} = require('../models');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const {
  generateSecureToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');
const { logLoginActivity } = require('../services/activityService');

const router = express.Router();

const MAX_FAILED_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 5);
const LOCK_DURATION_MINUTES = Number(process.env.ACCOUNT_LOCK_MINUTES || 15);
const EMAIL_VERIFY_EXPIRES_HOURS = Number(process.env.EMAIL_VERIFY_EXPIRES_HOURS || 24);
const PASSWORD_RESET_EXPIRES_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 30);
const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await user.update({ refresh_token: refreshToken });
  return { accessToken, refreshToken };
};

const createEmailVerificationToken = async (userId) => {
  await EmailVerificationToken.destroy({ where: { user_id: userId } });

  const token = generateSecureToken();
  const expires_at = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_HOURS * 60 * 60 * 1000);

  await EmailVerificationToken.create({
    user_id: userId,
    token,
    expires_at,
  });

  return token;
};

const createPasswordResetToken = async (userId) => {
  await PasswordResetToken.update(
    { is_used: true },
    { where: { user_id: userId, is_used: false } }
  );

  const token = generateSecureToken();
  const expires_at = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

  await PasswordResetToken.create({
    user_id: userId,
    token,
    expires_at,
    is_used: false,
  });

  return token;
};

const isAccountLocked = (user) =>
  Boolean(user.locked_until && new Date(user.locked_until) > new Date());

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  is_email_verified: user.is_email_verified,
  is_active: user.is_active,
});

// @desc    Register a new user (sends email verification)
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password_hash,
      role: 'user',
      is_email_verified: false,
      failed_login_attempts: 0,
      locked_until: null,
    });

    await Profile.create({
      user_id: user.id,
      display_name: display_name || email.split('@')[0],
    });

    const token = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(user, token);

    return res.status(201).json({
      message: 'User registered successfully. Please verify your email before logging in.',
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
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

    if (!user) {
      await logLoginActivity({
        userId: null,
        status: 'failed',
        message: 'Unknown email',
        req,
      });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      await logLoginActivity({
        userId: user.id,
        status: 'inactive',
        message: 'Account inactive',
        req,
      });
      return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
    }

    if (isAccountLocked(user)) {
      await logLoginActivity({
        userId: user.id,
        status: 'locked',
        message: 'Account locked',
        req,
      });
      return res.status(403).json({
        message: `Account is temporarily locked due to too many failed login attempts. Try again after ${user.locked_until.toISOString()}.`,
        locked_until: user.locked_until,
      });
    }

    // Clear expired lock
    if (user.locked_until && new Date(user.locked_until) <= new Date()) {
      await user.update({ locked_until: null, failed_login_attempts: 0 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const attempts = user.failed_login_attempts + 1;
      const updates = { failed_login_attempts: attempts };

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        updates.failed_login_attempts = 0;
      }

      await user.update(updates);

      await logLoginActivity({
        userId: user.id,
        status: updates.locked_until ? 'locked' : 'failed',
        message: updates.locked_until
          ? `Locked after ${MAX_FAILED_ATTEMPTS} failed attempts`
          : `Failed attempt ${attempts}/${MAX_FAILED_ATTEMPTS}`,
        req,
      });

      if (updates.locked_until) {
        return res.status(403).json({
          message: `Too many failed login attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`,
          locked_until: updates.locked_until,
        });
      }

      return res.status(401).json({
        message: 'Invalid email or password.',
        remaining_attempts: MAX_FAILED_ATTEMPTS - attempts,
      });
    }

    if (REQUIRE_EMAIL_VERIFICATION && !user.is_email_verified) {
      await logLoginActivity({
        userId: user.id,
        status: 'unverified',
        message: 'Email not verified',
        req,
      });
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    await user.update({
      failed_login_attempts: 0,
      locked_until: null,
    });

    const tokens = await issueTokens(user);

    await logLoginActivity({
      userId: user.id,
      status: 'success',
      message: 'Login successful',
      req,
    });

    return res.status(200).json({
      message: 'Login successful.',
      user: publicUser(user),
      ...tokens,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Verify email with token
// @route   POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    const record = await EmailVerificationToken.findOne({ where: { token } });

    if (!record) {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    if (new Date(record.expires_at) < new Date()) {
      await record.destroy();
      return res.status(400).json({ message: 'Verification token has expired.' });
    }

    const user = await User.findByPk(record.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.update({ is_email_verified: true });
    await EmailVerificationToken.destroy({ where: { user_id: user.id } });

    return res.status(200).json({
      message: 'Email verified successfully. You can now log in.',
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ where: { email } });

    // Always return generic success to avoid email enumeration
    if (!user || user.is_email_verified) {
      return res.status(200).json({
        message: 'If the account exists and is unverified, a new verification email has been sent.',
      });
    }

    const token = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(user, token);

    return res.status(200).json({
      message: 'If the account exists and is unverified, a new verification email has been sent.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ where: { email } });

    if (user && user.is_active) {
      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(user, token);
    }

    return res.status(200).json({
      message: 'If the email exists, a password reset link has been sent.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, password } = req.body;
    const nextPassword = newPassword || password;

    if (!token || !nextPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    if (nextPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const record = await PasswordResetToken.findOne({ where: { token } });

    if (!record || record.is_used) {
      return res.status(400).json({ message: 'Invalid or already used reset token.' });
    }

    if (new Date(record.expires_at) < new Date()) {
      await record.update({ is_used: true });
      return res.status(400).json({ message: 'Reset token has expired.' });
    }

    const user = await User.findByPk(record.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const password_hash = await bcrypt.hash(nextPassword, 10);

    await user.update({
      password_hash,
      refresh_token: null,
      failed_login_attempts: 0,
      locked_until: null,
    });

    await record.update({ is_used: true });

    // Invalidate other unused reset tokens for this user
    await PasswordResetToken.update(
      { is_used: true },
      {
        where: {
          user_id: user.id,
          is_used: false,
          id: { [Op.ne]: record.id },
        },
      }
    );

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

    if (isAccountLocked(user)) {
      return res.status(403).json({
        message: 'Account is temporarily locked.',
        locked_until: user.locked_until,
      });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// @desc    Logout and revoke refresh token
// @route   POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await req.user.update({ refresh_token: null });
    return res.status(200).json({ message: 'Logout successful.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

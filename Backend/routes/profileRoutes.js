const express = require('express');
const path = require('path');
const { Profile, LoginActivityLog } = require('../models');
const { authMiddleware } = require('../middleware/authMiddleware');
const { avatarUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(authMiddleware);

// @desc    Get current user profile
// @route   GET /api/profile
router.get('/', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    return res.status(200).json({
      ...profile.toJSON(),
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        is_email_verified: req.user.is_email_verified,
        is_active: req.user.is_active,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Update current user profile
// @route   PATCH /api/profile
router.patch('/', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const { display_name, avatar_url, bio, phone } = req.body;
    const updates = {};

    if (display_name !== undefined) updates.display_name = display_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No profile fields provided to update.' });
    }

    await profile.update(updates);

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @desc    Upload profile avatar
// @route   POST /api/profile/avatar
router.post('/avatar', (req, res) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'File too large. Maximum avatar size is 2MB.',
          });
        }
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Avatar file is required (multipart field name: avatar).',
        });
      }

      const profile = await Profile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found.' });
      }

      const avatar_url = `/uploads/avatars/${path.basename(req.file.filename)}`;
      await profile.update({ avatar_url });

      return res.status(200).json({
        message: 'Avatar uploaded successfully.',
        avatar_url,
        profile,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });
});

// @desc    Get current user login activity history
// @route   GET /api/profile/activity
router.get('/activity', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await LoginActivityLog.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

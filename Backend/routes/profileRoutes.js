const express = require('express');
const { Profile } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

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

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

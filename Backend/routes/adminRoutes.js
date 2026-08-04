const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { User, Profile } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

// @desc    List all users (Admin)
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const where = {};
    if (search) {
      const operator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      where.email = { [operator]: `%${search}%` };
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ['password_hash', 'refresh_token'],
      },
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'display_name', 'avatar_url', 'bio', 'phone'],
        },
      ],
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

// @desc    Suspend / activate a user account (Admin)
// @route   PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active (boolean) is required.' });
    }

    if (userId === req.user.id && is_active === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updates = { is_active };
    if (!is_active) {
      updates.refresh_token = null;
    }

    await user.update(updates);

    return res.status(200).json({
      message: `User account has been ${is_active ? 'activated' : 'suspended'}.`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Change user role (Admin)
// @route   PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "role must be 'user' or 'admin'." });
    }

    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.update({ role });

    return res.status(200).json({
      message: 'User role updated successfully.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = Profile;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
      notEmpty: { msg: 'Email is required' },
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  // Keep Sequelize default table name "Users" to match existing DB data
  tableName: 'Users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;

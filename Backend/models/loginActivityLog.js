const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LoginActivityLog = sequelize.define('LoginActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      'success',
      'failed',
      'locked',
      'inactive',
      'unverified'
    ),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'login_activity_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = LoginActivityLog;

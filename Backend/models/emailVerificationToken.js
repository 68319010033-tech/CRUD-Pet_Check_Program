const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EmailVerificationToken = sequelize.define('EmailVerificationToken', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'email_verification_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = EmailVerificationToken;

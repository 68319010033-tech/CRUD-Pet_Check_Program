const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pet = sequelize.define('Pet', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a pet name' }
    }
  },
  species: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a species' }
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  checkUpStatus: {
    type: DataTypes.ENUM('Healthy', 'Needs Attention', 'Scheduled'),
    defaultValue: 'Scheduled',
  },
  lastCheckUp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
});

module.exports = Pet;
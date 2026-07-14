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
    validate: { notEmpty: { msg: 'Please add a pet name' } }
  },
  type: { // เปลี่ยนจาก species เป็น type ให้ตรงหน้าฟอร์ม
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'Please add a type' } }
  },
  breed: { // เพิ่มให้ตรงหน้าฟอร์ม
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: { // เพิ่มให้ตรงหน้าฟอร์ม
    type: DataTypes.INTEGER, // หรือ DataTypes.DECIMAL
    allowNull: false,
  },
  image: { // เพิ่มให้ตรงหน้าฟอร์ม
    type: DataTypes.STRING,
    allowNull: true,
  },
  tags: { // เพิ่มให้ตรงหน้าฟอร์ม
    type: DataTypes.STRING,
    allowNull: true,
  },
  available: { // เปลี่ยนจากระบบตรวจสุขภาพเดิมมาเป็นสถานะว่าง/ไม่ว่าง
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
});

module.exports = Pet;
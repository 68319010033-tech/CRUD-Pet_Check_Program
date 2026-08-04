require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
require('../models');
const { User, Profile } = require('../models');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@cozytail.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const displayName = process.env.ADMIN_DISPLAY_NAME || 'System Admin';

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    let user = await User.findOne({ where: { email } });

    if (user) {
      await user.update({
        role: 'admin',
        is_email_verified: true,
        is_active: true,
        failed_login_attempts: 0,
        locked_until: null,
      });
      console.log(`Updated existing user to admin: ${email}`);
    } else {
      const password_hash = await bcrypt.hash(password, 10);
      user = await User.create({
        email,
        password_hash,
        role: 'admin',
        is_email_verified: true,
        is_active: true,
      });
      await Profile.create({
        user_id: user.id,
        display_name: displayName,
      });
      console.log(`Created admin user: ${email}`);
      console.log(`Temporary password: ${password}`);
    }
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seedAdmin();

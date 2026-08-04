/**
 * Removes the leftover empty lowercase "users" table that breaks
 * sequelize.sync({ alter: true }) FK generation for Profiles.
 */
require('dotenv').config();
const sequelize = require('../config/db');

(async () => {
  try {
    const [[{ exists }]] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'users'
      ) AS exists
    `);

    if (!exists) {
      console.log('No lowercase "users" table found. Nothing to fix.');
      return;
    }

    const [[{ count }]] = await sequelize.query('SELECT COUNT(*)::int AS count FROM users');
    if (count > 0) {
      throw new Error(
        `Refusing to drop lowercase "users" because it has ${count} row(s). Move data to "Users" first.`
      );
    }

    await sequelize.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('Dropped empty lowercase "users" table.');

    // Ensure Profiles FK points at "Users" (safe if already correct).
    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'Profiles'
            AND constraint_name = 'Profiles_user_id_fkey1'
        ) THEN
          ALTER TABLE "Profiles" DROP CONSTRAINT "Profiles_user_id_fkey1";
        END IF;
      END $$;
    `);

    console.log('FK cleanup complete.');
  } finally {
    await sequelize.close();
  }
})().catch((error) => {
  console.error('Failed to fix users FK:', error.message);
  process.exit(1);
});

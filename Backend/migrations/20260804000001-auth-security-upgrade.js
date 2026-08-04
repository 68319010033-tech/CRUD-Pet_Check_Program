'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Prefer existing Sequelize table "Users"; fall back to "users"
    let usersTable = 'Users';
    let table = await queryInterface.describeTable('Users').catch(() => null);
    if (!table) {
      usersTable = 'users';
      table = await queryInterface.describeTable('users').catch(() => null);
    }

    if (table) {
      if (!table.role) {
        await queryInterface.addColumn(usersTable, 'role', {
          type: Sequelize.ENUM('user', 'admin'),
          allowNull: false,
          defaultValue: 'user',
        });
      }
      if (!table.is_email_verified) {
        await queryInterface.addColumn(usersTable, 'is_email_verified', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
      }
      if (!table.failed_login_attempts) {
        await queryInterface.addColumn(usersTable, 'failed_login_attempts', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        });
      }
      if (!table.locked_until) {
        await queryInterface.addColumn(usersTable, 'locked_until', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
    }

    await queryInterface.createTable('email_verification_tokens', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: usersTable, key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }).catch(() => {});

    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: usersTable, key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }).catch(() => {});

    await queryInterface.createTable('login_activity_log', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: usersTable, key: 'id' },
        onDelete: 'SET NULL',
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'locked', 'inactive', 'unverified'),
        allowNull: false,
      },
      message: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.dropTable('login_activity_log').catch(() => {});
    await queryInterface.dropTable('password_reset_tokens').catch(() => {});
    await queryInterface.dropTable('email_verification_tokens').catch(() => {});

    await queryInterface.removeColumn('Users', 'locked_until').catch(() => {});
    await queryInterface.removeColumn('Users', 'failed_login_attempts').catch(() => {});
    await queryInterface.removeColumn('Users', 'is_email_verified').catch(() => {});
    await queryInterface.removeColumn('Users', 'role').catch(() => {});
    await queryInterface.removeColumn('users', 'locked_until').catch(() => {});
    await queryInterface.removeColumn('users', 'failed_login_attempts').catch(() => {});
    await queryInterface.removeColumn('users', 'is_email_verified').catch(() => {});
    await queryInterface.removeColumn('users', 'role').catch(() => {});

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_login_activity_log_status";').catch(() => {});
  },
};

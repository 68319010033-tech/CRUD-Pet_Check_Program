const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connection established successfully.');

    // Prefer plain sync() — alter:true regularly breaks Postgres FKs when a
    // leftover lowercase "users" table exists beside "Users".
    // Opt-in with DB_SYNC_ALTER=true only when you intentionally want alter.
    const useAlter = process.env.DB_SYNC_ALTER === 'true';
    if (useAlter) {
      try {
        await sequelize.sync({ alter: true });
        console.log('Database tables synchronized (alter).');
      } catch (syncError) {
        console.warn('sync({ alter: true }) failed, retrying with sync() only...');
        console.warn(syncError.message);
        await sequelize.sync();
        console.log('Database tables synchronized (without alter).');
      }
    } else {
      await sequelize.sync();
      console.log('Database tables synchronized.');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message || error);
    console.error('Hint: check Backend/.env DB_* values and that Postgres is running on DB_PORT.');
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

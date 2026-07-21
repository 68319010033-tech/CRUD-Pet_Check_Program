const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/db');
require('./models');
const petRoutes = require('./routes/petRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/pets', petRoutes);

app.get('/', (req, res) => {
  res.send('Pet-Check Postgres API is running...');
});

const PORT = process.env.PORT || 5000;

// Test DB connection and sync tables
const startServer = async () => {
  try {
    await sequelize.authenticate(); // Verify connection config
    console.log('PostgreSQL database connection established successfully.');

    // sync() looks at your models and creates tables in the DB if they don't exist
    await sequelize.sync({ alter: true }); 
    console.log('Database tables synchronized.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
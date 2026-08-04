const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

const dbName = process.env.DB_NAME || 'petcheckdb';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'Achirawit123';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = Number(process.env.DB_PORT || 5432);

if (!isTest && (dbPassword === undefined || dbPassword === null)) {
  throw new Error(
    'DB_PASSWORD is missing. Copy Backend/.env.example to Backend/.env and set DB credentials.'
  );
}

const sequelize = isTest
  ? new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    })
  : new Sequelize(dbName, dbUser, String(dbPassword), {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: false,
    });

module.exports = sequelize;

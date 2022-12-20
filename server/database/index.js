const { Sequelize } = require('sequelize');
const config = require('../config');

const dbConfig = process.env.NODE_ENV === 'production-debug' ? config.database_prod : config.database;
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: process.env.NODE_ENV === 'production-debug' ? true : () => {}
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    process.exit(0);
  }
})();

module.exports = sequelize;
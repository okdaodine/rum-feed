const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const UniqueCounter = sequelize.define('uniqueCounters', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
  },
  objectId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    unique: true,
    fields: ['objectId', 'userAddress']
  }, {
    fields: ['objectId']
  }]
});

UniqueCounter.sync();

module.exports = UniqueCounter;
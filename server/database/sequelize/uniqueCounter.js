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
    allowNull: false
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
    fields: ['name', 'objectId', 'userAddress']
  }]
});

UniqueCounter.sync();

module.exports = UniqueCounter;
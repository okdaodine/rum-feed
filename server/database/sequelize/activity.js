

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Activity = sequelize.define('activities', {
  userAddress: {
    primaryKey: true,
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastActiveAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['userAddress']
  }]
});

Activity.sync();

module.exports = Activity;
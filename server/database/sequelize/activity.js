

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Activity = sequelize.define('activities', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  content: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  url: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  timestamp: {
    type: Sequelize.DATE,
    allowNull: false,
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['groupId']
  }, {
    fields: ['userAddress']
  }, {
    fields: ['type']
  }]
});

Activity.sync();

module.exports = Activity;
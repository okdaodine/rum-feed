const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const BotSubscriptions = sequelize.define('botSubscriptions', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['userId']
  }, {
    fields: ['status']
  }]
});

BotSubscriptions.sync();

module.exports = BotSubscriptions;
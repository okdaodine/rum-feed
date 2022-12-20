

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Notification = sequelize.define('notifications', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  to: {
    type: Sequelize.STRING,
    allowNull: false
  },
  toObjectType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  toObjectId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  from: {
    type: Sequelize.STRING,
    allowNull: false
  },
  fromObjectType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  fromObjectId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false
  },
  timestamp: {
    type: Sequelize.DATE,
    allowNull: false
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['groupId']
  }, {
    fields: ['type']
  }, {
    fields: ['to']
  } , {
    fields: ['status']
  }]
});

Notification.sync();

module.exports = Notification;
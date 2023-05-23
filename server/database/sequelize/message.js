

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Message = sequelize.define('messages', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fromAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fromPubKey: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fromContent: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  toAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  toPubKey: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  toContent: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['conversationId']
  }, {
    fields: ['fromAddress']
  }, {
    fields: ['toAddress']
  }, {
    fields: ['timestamp']
  }, {
    fields: ['status']
  }]
});

Message.sync();

module.exports = Message;
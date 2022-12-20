const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Content = sequelize.define('contents', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  log: {
    type: Sequelize.JSON
  },
  groupId: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  Data: {
    type: Sequelize.JSON,
  },
  Expired: {
    type: Sequelize.BIGINT,
  },
  GroupId: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  SenderPubkey: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  SenderSign: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  TimeStamp: {
    type: Sequelize.STRING
  },
  TrxId: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  Version: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['id']
  }, {
    fields: ['groupId']
  }]
});

Content.sync();

module.exports = Content;
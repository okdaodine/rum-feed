const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Group = sequelize.define('groups', {
  groupId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  groupName: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  seedUrl: {
    type: Sequelize.TEXT,
    defaultValue: ''
  },
  startTrx: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  loaded: {
    type: Sequelize.BOOLEAN
  },
  contentCount: {
    type: Sequelize.INTEGER,
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['groupId']
  }]
});

Group.sync();

module.exports = Group;
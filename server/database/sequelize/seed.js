const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Seed = sequelize.define('seeds', {
  url: {
    unique: true,
    type: Sequelize.TEXT,
    allowNull: false,
    primaryKey: true,
  },
  groupId: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  groupName: {
    type: Sequelize.STRING,
    defaultValue: ''
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['groupId']
  }, {
    fields: ['url']
  }]
});

Seed.sync();

module.exports = Seed;
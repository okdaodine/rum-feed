const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Orphan = sequelize.define('orphans', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: Sequelize.JSON,
    allowNull: false
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  parentId: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [ {
    fields: ['groupId']
  }, {
    fields: ['parentId']
  }]
});

Orphan.sync();

module.exports = Orphan;
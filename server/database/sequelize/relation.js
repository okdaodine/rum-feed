const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const relation = sequelize.define('relations', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: Sequelize.STRING,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  to: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  from: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['type']
  }, {
    fields: ['from']
  }, {
    fields: ['to']
  }]
});

relation.sync();

module.exports = relation;
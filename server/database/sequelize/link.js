const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Link = sequelize.define('links', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  data: {
    type: Sequelize.JSON,
    allowNull: false,
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    unique: true,
    fields: ['url']
  }]
});

Link.sync({ force: true });

module.exports = Link;
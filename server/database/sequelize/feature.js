

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Feature = sequelize.define('features', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  image: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: ''
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['id']
  }, {
    fields: ['createdAt']
  }]
});

Feature.sync();

module.exports = Feature;
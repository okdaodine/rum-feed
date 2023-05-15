

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Favorite = sequelize.define('favorites', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  objectType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  objectId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['groupId']
  }, {
    fields: ['userAddress']
  }, {
    fields: ['objectType']
  }, {
    fields: ['objectId']
  }]
});

Favorite.sync();

module.exports = Favorite;
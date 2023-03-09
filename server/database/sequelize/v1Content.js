const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const V1Contents = sequelize.define('v1Contents', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  trxId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  data: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  raw: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  userAddress: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'pending'
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['trxId']
  }, {
    fields: ['groupId']
  }, {
    fields: ['userAddress']
  }, {
    fields: ['status']
  }]
});

V1Contents.sync();

module.exports = V1Contents;
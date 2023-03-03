const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Wallet = sequelize.define('wallets', {
  address: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  providerAddress: {
    primaryKey: true,
    type: Sequelize.STRING,
    allowNull: false,
  },
  encryptedPrivateKey: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    unique: true,
    fields: ['address']
  }, {
    unique: true,
    fields: ['providerAddress']
  }]
});

Wallet.sync();

module.exports = Wallet;
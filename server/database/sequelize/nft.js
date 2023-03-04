const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const NFT = sequelize.define('nfts', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  mainnet: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  contractAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  image: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  tokenId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['mainnet', 'contractAddress', 'userAddress']
  }]
});

NFT.sync();

module.exports = NFT;
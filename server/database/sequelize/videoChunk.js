const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const VideoChunks = sequelize.define('videoChunks', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  fileName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  chunkName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['fileName']
  }, {
    fields: ['chunkName']
  }]
});

VideoChunks.sync();

module.exports = VideoChunks;
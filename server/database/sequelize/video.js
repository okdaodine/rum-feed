const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Video = sequelize.define('videos', {
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
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false
  },
  mediaType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  duration: {
    type: Sequelize.STRING,
    allowNull: false
  },
  width: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  height: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['fileName']
  }]
});

Video.sync();

module.exports = Video;
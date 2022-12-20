

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Profile = sequelize.define('profiles', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  avatar: {
    type: Sequelize.TEXT,
    defaultValue: ''
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['groupId']
  }, {
    fields: ['userAddress']
  }]
});

Profile.sync();

module.exports = Profile;
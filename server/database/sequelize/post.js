const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Post = sequelize.define('posts', {
  trxId: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true
  },
  id: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  title: {
    type: Sequelize.STRING
  },
  content: {
    type: Sequelize.TEXT,
    defaultValue: ''
  },
  images: {
    type: Sequelize.JSON,
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  storage: {
    type: Sequelize.STRING,
    allowNull: false
  },
  timestamp: {
    type: Sequelize.DATE,
    allowNull: false
  },
  commentCount: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  likeCount: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  imageCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
}, {
  charset: 'utf8mb4',
  timestamps: false,
  indexes: [{
    fields: ['trxId']
  }, {
    fields: ['id']
  }, {
    fields: ['userAddress']
  }, {
    fields: ['groupId']
  }, {
    fields: ['timestamp']
  }, {
    fields: ['commentCount']
  }, {
    fields: ['likeCount']
  }]
});

Post.sync();

module.exports = Post;
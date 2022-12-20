

const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Comment = sequelize.define('comments', {
  trxId: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true
  },
  content: {
    type: Sequelize.TEXT,
    defaultValue: ''
  },
  images: {
    type: Sequelize.JSON,
  },
  objectId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  threadId: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  replyId: {
    type: Sequelize.STRING,
    defaultValue: ''
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
  hotCount: {
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
    fields: ['userAddress']
  }, {
    fields: ['objectId']
  }, {
    fields: ['threadId']
  }, {
    fields: ['groupId']
  }, {
    fields: ['timestamp']
  }, {
    fields: ['commentCount']
  }, {
    fields: ['likeCount']
  }, {
    fields: ['hotCount']
  }]
});

Comment.sync();

module.exports = Comment;
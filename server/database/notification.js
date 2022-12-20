const Notification = require('./sequelize/notification');
const Post = require('./post');
const Comment = require('./comment');
const Profile = require('./profile');
const getDefaultProfile = require('../utils/getDefaultProfile');

exports.create = async (item) => {
  return await Notification.create(item);
};

exports.update = async (id, item) => {
  return await Notification.update(item, {
    where: {
      id
    }
  });
};

exports.markAsRead = async (where) => {
  return await Notification.update({
    status: 'read'
  }, { where });
};

exports.list = async (query) => {
  const items = await Notification.findAll(query);
  return items.map(item => item.toJSON());
};

exports.appendExtra = async (item) => {
  item.extra = {};

  if (item.toObjectType === 'post') {
    try {
      item.extra.toObject = await Post.get(item.toObjectId, {
        withReplacedImage: true,
        withExtra: true
      });
    } catch (_) {}
  } else if (item.toObjectType === 'comment') {
    try {
      item.extra.toObject = await Comment.get(item.toObjectId, {
        withReplacedImage: true,
        withExtra: true
      });
    } catch (_) {}
  }
  
  if (item.fromObjectType === 'post') {
    try {
      item.extra.fromObject = await Post.get(item.fromObjectId, {
        withReplacedImage: true,
        withExtra: true
      });
    } catch (_) {}
  } else if (item.fromObjectType === 'comment') {
    try {
      item.extra.fromObject = await Comment.get(item.fromObjectId, {
        withReplacedImage: true,
        withExtra: true
      });
    } catch (_) {}
  }

  item.extra.fromProfile = await Profile.get({
    userAddress: item.from
  }, {
    withReplacedImage: true
  }) || getDefaultProfile(item.from);
  return item;
}

exports.getUnreadCount = async (query) => {
  const count = await Notification.count({
    where: {
      ...query,
      status: 'unread'
    },
  });
  return count || 0;
};

exports.destroy = async (where) => {
  return await Notification.destroy({
    where
  });
};
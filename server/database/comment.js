const Comment = require('./sequelize/comment');
const { keyBy } = require('lodash');
const Profile = require('./profile');
const UniqueCounter = require('./uniqueCounter');
const getDefaultProfile = require('../utils/getDefaultProfile');
const config = require('../config');

exports.create = async (item) => {
  return await Comment.create(item);
};

exports.update = async (id, item) => {
  return await Comment.update(item, {
    where: {
      id
    }
  });
};

exports.replaceObjectId = async (objectId, newObjectId) => {
  return await Comment.update({
    objectId: newObjectId
  }, {
    where: {
      objectId
    }
  });
};

exports.get = async (id, options = {}) => {
  const query = {
    where: {
      id
    }
  };
  if (options.withReplacedImage) {
    query.attributes = { exclude: ['images'] };
  }
  const item = await Comment.findOne(query);
  if (!item) {
    return null;
  }
  const result = options.withReplacedImage ? replaceImages(item.toJSON()) : item.toJSON();
  if (options.withExtra) {
    return (await bulkAppendExtra([result], {
      viewer: options.viewer
    }))[0];
  }
  return result;
};

exports.destroy = async (id) => {
  await Comment.destroy({
    where: {
      id
    }
  });
};

exports.list = async (query, options = {}) => {
  if (options.withReplacedImage) {
    query.attributes = { exclude: ['images'] };
  }
  const items = await Comment.findAll(query);
  const result = items.map(item => options.withReplacedImage ? replaceImages(item.toJSON()) : item.toJSON());
  if (options.withExtra) {
    return await bulkAppendExtra(result, {
      viewer: options.viewer
    });
  }
}

exports.count = async (query) => {
  return await Comment.count(query);
}

const bulkAppendExtra = async (items, options = {}) => {
  const itemsMap = keyBy(items, 'id');
  items = items.map((item) => {
    item.extra = item.extra || {};
    if (item.replyId) {
      item.extra.replyComment = itemsMap[item.replyId];
    }
    return item;
  });

  if (options.viewer) {
    const likedMap = await getCounterMap({
      counterName: 'commentLike',
      userAddress: options.viewer,
      items
    });
    items = items.map((item) => {
      item.extra = item.extra || {};
      item.extra.liked = !!likedMap[item.id]
      return item;
    });
  }
  
  const profiles = await Profile.bulkGet(items.map((item) => ({
    userAddress: item.userAddress
  })), {
    withReplacedImage: true
  });
  const profileMap = keyBy(profiles, 'userAddress');
  items = items.map((item) => {
    item.extra.userProfile = profileMap[item.userAddress] || getDefaultProfile(item.userAddress)
    return item;
  });
  return items;
}

const getCounterMap = async (p) => {
  const counters = await UniqueCounter.bulkGet(p.items.map((item) => ({
    name: p.counterName,
    objectId: item.id,
    userAddress: p.userAddress
  })));
  return keyBy(counters, (counter) => counter.objectId);
}

const replaceImages = item => {
  if (item.imageCount > 0) {
    item.images = [];
    for (let i = 0; i < item.imageCount; i++) {
      item.images.push(`${config.serverOrigin || config.origin || ''}/api/images/comments/${item.id}/${i}`);
    }
  }
  return item;
}
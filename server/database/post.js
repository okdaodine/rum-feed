const Post = require('./sequelize/post');
const { keyBy } = require('lodash');
const Profile = require('./profile');
const UniqueCounter = require('./uniqueCounter');
const getDefaultProfile = require('../utils/getDefaultProfile');
const config = require('../config');
const rumSDK = require('rum-sdk-nodejs');

exports.create = async (item) => {
  return await Post.create(item);
};

exports.update = async (id, data) => {
  return await Post.update(data, {
    where: {
      id
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
  const item = await Post.findOne(query);
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

exports.destroy = async (postId) => {
  await Post.destroy({
    where: {
      id: postId
    }
  });
};

exports.list = async (query, options = {}) => {
  if (options.withReplacedImage) {
    query.attributes = { exclude: ['images'] };
  }
  const items = await Post.findAll(query);
  const result = items.map(item => options.withReplacedImage ? replaceImages(item.toJSON()) : item.toJSON());
  if (options.withExtra) {
    return await bulkAppendExtra(result, {
      viewer: options.viewer
    });
  }
  return result;
}

const bulkAppendExtra = async (items, options = {}) => {
  items = items.map((item) => {
    item.extra = item.extra || {};
    item.extra.groupName = rumSDK.cache.Group.get(item.groupId).groupName
    return item;
  });

  if (options.viewer) {
    const likedMap = await getCounterMap({
      counterName: 'postLike',
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
      item.images.push(`${config.serverOrigin || config.origin || ''}/api/images/posts/${item.id}/${i}`);
    }
  }
  return item;
}

exports.count = async (where) => {
  return await Post.count({
    where
  });
};
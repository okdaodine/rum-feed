const Post = require('./sequelize/post');
const { keyBy } = require('lodash');
const Profile = require('./profile');
const UniqueCounter = require('./uniqueCounter');
const getDefaultProfile = require('../utils/getDefaultProfile');
const config = require('../config');
const rumSDK = require('rum-sdk-nodejs');
const extractUrls = require('../utils/extractUrls');
const isRetweetUrl = require('../utils/isRetweetUrl');
const { Op } = require("sequelize");

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

  if (!options.skipRetweet) {
    const retweetMap = {};
    for (const item of items) {
      const urls = extractUrls(item.content || '').reverse();
      const retweetUrl = urls.find(url => isRetweetUrl(url));
      const retweetId = retweetUrl ? new URL(retweetUrl).pathname.split('/')[2] : null;
      if (retweetId) {
        retweetMap[retweetId] = [...retweetMap[retweetId] || [], item];
        item.extra.retweet = null;
      }
    }
    const retweetIds = Object.keys(retweetMap);
    if (retweetIds.length > 0) {
      let retweetItems = await Post.findAll({
        attributes: { exclude: ['images'] },
        where: {
          [Op.or]: retweetIds.map(retweetId => ({
            id: retweetId
          }))
        }
      });
      retweetItems = retweetItems.map(item => replaceImages(item.toJSON()));
      retweetItems = await bulkAppendExtra(retweetItems, {
        viewer: options.viewer,
        skipRetweet: true,
      });
      for (const retweetItem of retweetItems) {
        for (const item of retweetMap[retweetItem.id] || []) {
          item.extra.retweet = retweetItem;
        }
      }
    }
  }


  return items;
}

const getCounterMap = async (p) => {
  const counters = await UniqueCounter.bulkGet(p.items.map((item) => ({
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
const { Op } = require("sequelize");
const Profile = require('./sequelize/profile');
const config = require('../config');

exports.upsert = async (item) => {
  const where = {
    userAddress: item.userAddress,
  };
  const exist = await Profile.findOne({
    where
  });
  if (exist) {
    await Profile.update({
      name: item.name,
      avatar: item.avatar,
      updatedAt: item.updatedAt
    }, {
      where
    })
  } else {
    await Profile.create(item);
  }
};

exports.get = async (index, options = {}) => {
  const query = {
    where: index,
  };
  if (options.withReplacedImage) {
    query.attributes = { exclude: ['avatar'] };
  }
  const item = await Profile.findOne(query);
  if (!item) {
    return null;
  }
  return  pack(item.toJSON(), options);
};

exports.bulkGet = async (indexes, options ={}) => {
  if (indexes.length === 0) {
    return [];
  }
  const query = {
    where: {
      [Op.or]: indexes
    }
  };
  if (options.withReplacedImage) {
    query.attributes = { exclude: ['avatar'] };
  }
  const items = await Profile.findAll(query);
  return items.map(item => pack(item.toJSON(), options));
};

const pack = (profile, options = {}) => {
  if (options.withReplacedImage) {
    return replaceImage(profile);
  }
  delete profile.updatedAt;
  return profile;
}

const replaceImage = profile => {
  profile.avatar = `${config.serverOrigin || config.origin || ''}/api/images/profiles/${profile.userAddress}`
  if (profile.updatedAt) {
    profile.avatar += `?${new Date(profile.updatedAt).getTime()}`;
  }
  delete profile.updatedAt;
  return profile;
}
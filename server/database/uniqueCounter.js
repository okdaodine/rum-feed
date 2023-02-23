const { Op } = require("sequelize");
const UniqueCounter = require('./sequelize/uniqueCounter');

exports.CounterName = {
  postLike: 'postLike',
  commentLike: 'commentLike',
}

exports.upsert = async (item) => {
  await UniqueCounter.upsert(item);
};

exports.destroy = async (where) => {
  return await UniqueCounter.destroy({
    where
  });
};

exports.bulkGet = async (queries) => {
  if (queries.length === 0) {
    return [];
  }
  return await UniqueCounter.findAll({
    where: {
      [Op.or]: queries
    }
  });
};

exports.count = async (query) => {
  return await UniqueCounter.count(query);
}

exports.replaceObjectId = async (objectId, newObjectId) => {
  return await UniqueCounter.update({
    objectId: newObjectId
  }, {
    where: {
      objectId
    }
  });
};
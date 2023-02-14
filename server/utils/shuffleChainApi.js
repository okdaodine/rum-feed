const { shuffle } = require('lodash');
const rumSDK = require('rum-sdk-nodejs');
const { assert, Errors } = require('../utils/validator');
const Group = require('../database/sequelize/group');

module.exports = async groupId => {
  const group = await Group.findOne({
    where: {
      groupId
    }
  });
  assert(group, Errors.ERR_NOT_FOUND('group'));
  const [ baseUrl, chainUrl ] = group.seedUrl.split('&u=');
  const chainAPIs = shuffle(chainUrl.split('|'));
  const seedUrl = baseUrl + '&u=' + chainAPIs.join('|');
  await Group.update({
    seedUrl
  }, {
    where: {
      groupId
    }
  })
  rumSDK.cache.Group.remove(groupId);
  rumSDK.cache.Group.add(seedUrl);
  return chainAPIs;
}
const { shuffle } = require('lodash');
const rumsdk = require('rum-sdk-nodejs');
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
  rumsdk.cache.Group.remove(groupId);
  rumsdk.cache.Group.add(seedUrl);
  return chainAPIs;
}
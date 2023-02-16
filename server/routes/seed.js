const router = require('koa-router')();
const { assert, Errors } = require('../utils/validator');
const rumSDK = require('rum-sdk-nodejs');
const Group = require('../database/sequelize/group');
const Seed = require('../database/sequelize/seed');
const { ensurePermission } = require('../middleware/api');

router.post('/', ensurePermission, create);

async function create(ctx) {
  const { url } = ctx.request.body;
  assert(url, Errors.ERR_IS_REQUIRED('url'));
  const groupId = await createSeed(url);
  ctx.body = await Group.findOne({
    where: {
      groupId
    }
  });
}

const createSeed = async (url) => {
  const existGroup = await Seed.findOne({
    where: {
      url
    }
  });
  assert(!existGroup, Errors.ERR_IS_DUPLICATED('url'));
  const { groupId, chainAPIs, groupName } = rumSDK.utils.seedUrlToGroup(url);
  assert(chainAPIs.length > 0, Errors.ERR_IS_REQUIRED('chainAPIs'));
  await Seed.create({
    url,
    groupId,
    groupName,
  });
  const seeds = await Seed.findAll({
    where: {
      groupId
    }
  });
  const baseSeedUrl = seeds[0].url.split('&u=')[0];
  const apiMap = {};
  for (const seed of seeds) {
    const group = rumSDK.utils.seedUrlToGroup(seed.url);
    for (const api of group.chainAPIs) {
      const origin = new URL(api).origin;
      apiMap[origin] = api;
    }
  }
  const combinedSeedUrl = `${baseSeedUrl}&u=${Object.values(apiMap).join('|')}`;
  const group = await Group.findOne({
    where: {
      groupId
    }
  });
  if (group) {
    await Group.update({
      seedUrl: combinedSeedUrl
    }, {
      where: {
        groupId
      }
    });
  } else {
    await Group.create({
      seedUrl: combinedSeedUrl,
      groupId,
      groupName,
      startTrx: '',
      status: '',
      loaded: false,
      contentCount: 0
    });
  }
  rumSDK.cache.Group.remove(groupId);
  rumSDK.cache.Group.add(combinedSeedUrl);
  return groupId;
}

module.exports = router;
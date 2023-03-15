const router = require('koa-router')();
const { assert, Errors } = require('../utils/validator');
const rumSDK = require('rum-sdk-nodejs');
const Group = require('../database/sequelize/group');
const Seed = require('../database/sequelize/seed');
const { ensurePermission } = require('../middleware/api');
const Content = require('../database/sequelize/content');
const Post = require('../database/sequelize/post');
const Comment = require('../database/sequelize/comment');
const Profile = require('../database/sequelize/profile');
const Orphan = require('../database/sequelize/orphan');
const Notification = require('../database/sequelize/notification');
const V1Content = require('../database/sequelize/v1Content');

router.post('/', ensurePermission, create);
router.post('/migrate', ensurePermission, migrate);

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

async function migrate(ctx) {
  const { url, oldGroupId } = ctx.request.body;
  assert(url, Errors.ERR_IS_REQUIRED('url'));
  const groupId = await createSeed(url);
  const oldGroupQuery = { where: { groupId: oldGroupId } };
  const oldGroup = await Group.findOne(oldGroupQuery);

  await Group.destroy(oldGroupQuery);
  await Seed.destroy(oldGroupQuery);
  await Orphan.destroy(oldGroupQuery);

  await Content.update({ groupId, GroupId: groupId }, oldGroupQuery);
  await Post.update({ groupId }, oldGroupQuery);
  await Comment.update({ groupId }, oldGroupQuery);
  await Profile.update({ groupId }, oldGroupQuery);
  await Notification.update({ groupId }, oldGroupQuery);
  await V1Content.update({ groupId }, oldGroupQuery);

  await Group.update({ contentCount: oldGroup.contentCount }, { where: { groupId } });

  rumSDK.cache.Group.remove(oldGroupId);
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
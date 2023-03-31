const sequelize = require('../database');
const { assert, Errors } = require('../utils/validator');
const rumSDK = require('rum-sdk-nodejs');
const Group = require('../database/sequelize/group');
const Content = require('../database/sequelize/content');
const V1Content = require('../database/sequelize/v1Content');
const Seed = require('../database/sequelize/seed');
const Post = require('../database/sequelize/post');
const Comment = require('../database/sequelize/comment');
const Profile = require('../database/sequelize/profile');
const Orphan = require('../database/sequelize/orphan');
const Notification = require('../database/sequelize/notification');

(async () => {
  await sequelize.authenticate();
  
  const [, , groupId, newSeedUrl, dryRun] = process.argv;
  console.log(`[Migrate v2 to v2]:`, { groupId, newSeedUrl, dryRun });

  assert(groupId, Errors.ERR_IS_REQUIRED('groupId'));
  assert(newSeedUrl, Errors.ERR_IS_REQUIRED('newSeedUrl'));

  const group = await Group.findOne({ where: { groupId } });
  assert(group, Errors.ERR_NOT_FOUND('group'));
  const contentTrxIds = (await Content.findAll({
    attributes: ['TrxId'],
    where: { groupId },
    raw: true, 
    order: [
      ['id', 'ASC']
    ]
  })).map(c => c.TrxId);
  const v1ContentTrxIds = (await V1Content.findAll({
    attributes: ['trxId'],
    where: { groupId },
    raw: true,
    order: [
      ['id', 'ASC']
    ]
  })).map(c => c.trxId);
  const diff = contentTrxIds.length - v1ContentTrxIds.length;
  console.log(`[summary]:`, { 
    'contentTrxIds count': contentTrxIds.length,
    'v1ContentTrxIds count': v1ContentTrxIds.length,
    'diff': diff
  });

  if (diff === 0) {
    console.log('No data to migrate');
    return;
  }

  await V1Content.update({ status: 'pending' }, { where: { status: 'done' } });

  const v1ContentTrxIdSet = new Set(v1ContentTrxIds);
  for (const [index, contentTrxId] of Object.entries(contentTrxIds)) {
    if (!v1ContentTrxIdSet.has(contentTrxId)) {
      const content = await Content.findOne({ where: { TrxId: contentTrxId }, raw: true });
      console.log(`[Migrate content ${~~index + 1}]: ${contentTrxId} (id ${content.id})`);
      if (!dryRun) {
        await V1Content.create({
          data: content.Data,
          trxId: content.TrxId,
          groupId: content.GroupId,
          raw: content,
          userAddress: rumSDK.utils.pubkeyToAddress(content.SenderPubkey),
          status: 'pending'
        });
      }
    }
  }

  if (!dryRun) {
    console.log(`[Migrate group seed]`);
    migrate({ url: newSeedUrl, oldGroupId: group.groupId });
  }
})();

async function migrate(params) {
  const { url, oldGroupId } = params;
  assert(url, Errors.ERR_IS_REQUIRED('url'));
  const oldGroupQuery = { where: { groupId: oldGroupId } };

  const oldGroup = await Group.findOne(oldGroupQuery);

  if (url === oldGroupId) {
    await Group.destroy(oldGroupQuery);
  }

  const groupId = await createSeed(url);

  if (url !== oldGroupId) {
    await Group.destroy(oldGroupQuery);
  }

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
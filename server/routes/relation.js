
const router = require('koa-router')();
const Relation = require('../database/sequelize/relation');
const Profile = require('../database/profile');
const getDefaultProfile = require('../utils/getDefaultProfile');
const { keyBy } = require('lodash');

router.get('/:userAddress/following', listFollowing);
router.get('/:userAddress/followers', listFollowers);
router.get('/:userAddress/muted', listMuted);

async function listFollowing(ctx) {
  ctx.body = await list(ctx, 'following');
}

async function listFollowers(ctx) {
  ctx.body = await list(ctx, 'followers');
}

async function listMuted(ctx) {
  ctx.body = await list(ctx, 'muted');
}

async function list(ctx, type) {
  const where = {};
  if (type === 'followers') {
    where.type = 'following';
    where.to = ctx.params.userAddress;
  } else {
    where.type = type;
    where.from = ctx.params.userAddress;
  }
  let items = await Relation.findAll({
    where,
    order: [['id', 'DESC']],
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0
  });
  items = items.map(item => item.toJSON());
  const profiles = await Profile.bulkGet(items.map((item) => ({
    userAddress: type === 'followers' ? item.from : item.to
  })), {
    withReplacedImage: true
  });
  const profileMap = keyBy(profiles, 'userAddress');
  items = items.map((item) => {
    const address = type === 'followers' ? item.from : item.to;
    item.extra = {
      userProfile: profileMap[address] || getDefaultProfile(address)
    }
    return item;
  });
  return items;
}

module.exports = router;
const router = require('koa-router')();
const Activity = require('../database/sequelize/activity');
const Profile = require('../database/profile');
const getDefaultProfile = require('../utils/getDefaultProfile');
const { keyBy } = require('lodash');

router.get('/', list);

async function list(ctx) {
  const activities = await Activity.findAll({
    raw: true,
    order: [
      ['id', 'DESC']
    ],
    limit: Math.min(~~ctx.query.limit || 10, 50),
    offset: ctx.query.offset || 0
  });
  ctx.body = await pack(activities);
}

const pack = async (items) => {
  const profiles = await Profile.bulkGet(items.map((item) => ({
    userAddress: item.userAddress
  })), {
    withReplacedImage: true
  });
  const profileMap = keyBy(profiles, 'userAddress');
  items = items.map((item) => {
    item.extra = {};
    item.extra.userProfile = profileMap[item.userAddress] || getDefaultProfile(item.userAddress)
    return item;
  });
  return items;
}

module.exports = router;
const router = require('koa-router')();
const Activity = require('../database/sequelize/activity');
const Profile = require('../database/profile');
const getDefaultProfile = require('../utils/getDefaultProfile');
const Relation = require('../database/sequelize/relation');
const { Op } = require("sequelize");
const { keyBy } = require('lodash');

router.get('/', list);

async function list(ctx) {
  const where = {};

  if (ctx.query.viewer) {
    const muted = await Relation.findAll({
      raw: true,
      where: {
        type: 'muted',
        from: ctx.query.viewer
      },
    });
    
    const mutedMe = await Relation.findAll({
      raw: true,
      where: {
        type: 'muted',
        to: ctx.query.viewer
      }
    });

    if (muted.length > 0 || mutedMe.length > 0) {
      where.userAddress = {
        [Op.notIn]: [
          ...muted.map(item => item.to),
          ...mutedMe.map(mute => mute.from)
        ]
      };
    };
  }

  const activities = await Activity.findAll({
    raw: true,
    where,
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
    const profile = profileMap[item.userAddress] || getDefaultProfile(item.userAddress);
    profile.name = profile.name.split('\n')[0];
    item.extra.userProfile = profile;
    return item;
  });
  return items;
}

module.exports = router;
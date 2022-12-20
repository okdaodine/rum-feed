const router = require('koa-router')();
const Feature = require('../database/sequelize/feature');
const Activity = require('../database/sequelize/activity');
const { Op } = require("sequelize");
const { assert, Errors } = require('../utils/validator');
const { ethers } = require('quorum-light-node-sdk-nodejs');

router.get('/:userAddress', list);

async function list(ctx) {
  const { userAddress } = ctx.params;
  assert(ethers.utils.isAddress(userAddress), Errors.ERR_IS_INVALID('userAddress'));
  const activity = await Activity.findOne({
    where: {
      userAddress
    }
  });
  const lastActiveAt = activity ? activity.lastActiveAt : Date.now();
  const features = await Feature.findAll({
    where: {
      createdAt: {
        [Op.gte]: lastActiveAt
      }
    }
  });
  await Activity.upsert({
    userAddress,
    lastActiveAt: Date.now()
  });
  ctx.body = features;
}

module.exports = router;
const router = require('koa-router')();
const { assert, Errors } = require('../utils/validator');
const QuorumLightNodeSDK = require('quorum-light-node-sdk-nodejs');
const { Op } = require("sequelize");
const Group = require('../database/sequelize/group');
const Seed = require('../database/sequelize/seed');
const Content = require('../database/sequelize/content');
const Post = require('../database/sequelize/post');
const Comment = require('../database/sequelize/comment');
const Profile = require('../database/sequelize/profile');
const Notification = require('../database/sequelize/notification');
const { ensurePermission } = require('../middleware/api');
const shuffleChainApi = require('../utils/shuffleChainApi');
const config = require('../config');

router.get('/default', getDefaultGroup);
router.get('/relation', getRelationGroup);
router.get('/:groupId', get);
router.get('/:groupId/shuffle', _shuffleChainApi);
router.get('/:groupId/ping', ping);
router.delete('/:groupId', ensurePermission, remove);
router.get('/', list);

async function get(ctx) {
  const group = await Group.findOne({
    where: {
      groupId: ctx.params.groupId
    }
  });
  assert(group, Errors.ERR_NOT_FOUND('group'));
  ctx.body = pack(group.toJSON());
}

async function list(ctx) {
  const groups = await Group.findAll({
    order: [
      ['contentCount', 'DESC']
    ]
  });
  ctx.body = groups
              .filter(group => (
                group.seedUrl.includes('group_timeline') ||
                (config.userRelation?.visible && group.seedUrl.includes('group_relations'))
              ))
              .map(group => pack(group.toJSON()));
}

async function getDefaultGroup(ctx) {
  if (config.defaultGroupId) {
    const group = await Group.findOne({
      where: {
        groupId: config.defaultGroupId
      }
    });
    assert(group, Errors.ERR_NOT_FOUND('group'));
    ctx.body = pack(group.toJSON());
    return;
  }
  const groups = await Group.findAll({
    order: [
      ['contentCount', 'DESC']
    ]
  });
  const group = groups.find(g => g.seedUrl.includes('group_timeline') && g.status === 'connected');
  assert(group, Errors.ERR_NOT_FOUND('group'));
  ctx.body = pack(group.toJSON());
}

async function getRelationGroup(ctx) {
  const group = await Group.findOne({
    where: {
      seedUrl: {
        [Op.like]: `%group_relations%`
      }
    }
  });
  assert(group, Errors.ERR_NOT_FOUND('group'));
  ctx.body = group.toJSON();
}

async function _shuffleChainApi(ctx) {
  const { groupId } = ctx.params;
  const chainAPIs = await shuffleChainApi(groupId);
  ctx.body = chainAPIs;
}

const pack = group => {
  const rawGroup = QuorumLightNodeSDK.cache.Group.get(group.groupId);
  const [ baseUrl ] = group.seedUrl.split('&u=');
  const seedUrl = baseUrl + '&u=' + rawGroup.chainAPIs.join('|');
  return {
    ...group,
    seedUrl,
    extra: {
      rawGroup
    }
  };
}

async function ping(ctx) {
  const group = await Group.findOne({
    where: {
      groupId: ctx.params.groupId
    }
  });
  assert(group, Errors.ERR_NOT_FOUND('group'));
  assert(group.status === 'connected', Errors.ERR_IS_REQUEST_FAILED());
  ctx.body = true;
}

async function remove(ctx) {
  const { groupId } = ctx.params;
  await Group.destroy({ where: { groupId }});
  await Seed.destroy({ where: { groupId }});
  await Content.destroy({ where: { groupId }});
  await Post.destroy({ where: { groupId }});
  await Comment.destroy({ where: { groupId }});
  await Profile.destroy({ where: { groupId }});
  await Notification.destroy({ where: { groupId }});
  QuorumLightNodeSDK.cache.Group.remove(groupId);
  ctx.body = true;
}

module.exports = router;
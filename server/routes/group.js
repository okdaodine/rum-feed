const router = require('koa-router')();
const { assert, Errors } = require('../utils/validator');
const rumSDK = require('rum-sdk-nodejs');
const Group = require('../database/sequelize/group');
const Seed = require('../database/sequelize/seed');
const Content = require('../database/sequelize/content');
const Post = require('../database/sequelize/post');
const Comment = require('../database/sequelize/comment');
const Profile = require('../database/sequelize/profile');
const Notification = require('../database/sequelize/notification');
const Orphan = require('../database/sequelize/orphan');
const V1Content = require('../database/sequelize/v1Content');
const { ensurePermission } = require('../middleware/api');
const shuffleChainApi = require('../utils/shuffleChainApi');

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
  ctx.body = groups.map(group => pack(group.toJSON()));
}

async function _shuffleChainApi(ctx) {
  const { groupId } = ctx.params;
  const chainAPIs = await shuffleChainApi(groupId);
  ctx.body = chainAPIs;
}

const pack = group => {
  const rawGroup = rumSDK.cache.Group.get(group.groupId);
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
  await Orphan.destroy({ where: { groupId }});
  await V1Content.destroy({ where: { groupId }});
  rumSDK.cache.Group.remove(groupId);
  ctx.body = true;
}

module.exports = router;
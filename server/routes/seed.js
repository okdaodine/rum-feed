const router = require('koa-router')();
const { assert, Errors } = require('../utils/validator');
const Group = require('../database/sequelize/group');
const { ensurePermission } = require('../middleware/api');
const createSeed = require('../utils/createSeed');

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

module.exports = router;
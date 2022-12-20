const router = require('koa-router')();
const Content = require('../database/sequelize/content');
const { assert, Errors } = require('../utils/validator');

router.get('/:groupId', list);
router.get('/:groupId/:trxId', get);

async function list(ctx) {
  const attributes = {};
  if (ctx.query.minimal) {
    attributes.exclude = ['Data', 'log'];
  }
  const contents = await Content.findAll({
    attributes,
    where: {
      groupId: ctx.params.groupId
    },
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0,
    order: [
      ['id', 'DESC']
    ]
  });
  ctx.body = contents;
}

async function get(ctx) {
  const content = await Content.findOne({
    where: {
      groupId: ctx.params.groupId,
      TrxId: ctx.params.trxId,
    }
  });
  assert(content, Errors.ERR_NOT_FOUND('content'));
  ctx.body = content;
} 

module.exports = router;
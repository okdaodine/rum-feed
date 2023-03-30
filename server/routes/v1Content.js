const router = require('koa-router')();
const V1Content = require('../database/sequelize/v1Content');
const config = require('../config');

router.get('/', list);
router.post('/:trxId', done);
router.get('/summary', summary);
router.get('/:trxId', get);

async function list(ctx) {
  if (!config.enabledV1Migration) {
    ctx.body = [];
    return;
  }

  const { status, userAddress, raw } = ctx.query;
  const query = {
    where: {},
    limit: Math.min(~~ctx.query.limit || 10, 9999),
    offset: ctx.query.offset || 0,
    order: [['id', 'ASC']],
  };
  if (status) {
    query.where.status = status;
  }
  if (userAddress) {
    query.where.userAddress = userAddress;
  }
  if (!raw) {
    query.attributes = {
      exclude: ['raw']
    };
  }
  const contents = await V1Content.findAll(query);
  if (ctx.query.trxIdOnly) {
    ctx.body = contents.map(c => c.trxId);
    return;
  }
  ctx.body = contents;
}

async function done(ctx) {
  const { trxId } = ctx.params;
  await V1Content.update({
    status: 'done'
  }, {
    where: {
      trxId
    }
  });
  console.log(`v1 content done ${trxId} ✅ `);
  ctx.body = true;
}

async function get(ctx) {
  const { trxId } = ctx.params;
  const v1Content = await V1Content.findOne({ where: { trxId } });
  ctx.body = v1Content;
}

async function summary(ctx) {
  ctx.body = {
    pending: await V1Content.count({ where: { status: 'pending' } }),
    done: await V1Content.count({ where: { status: 'done' } }),
  }
}

module.exports = router;
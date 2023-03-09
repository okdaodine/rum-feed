const router = require('koa-router')();
const V1Content = require('../database/sequelize/v1Content');

router.get('/', list);
router.post('/:trxId', done);
router.get('/summary', summary);

async function list(ctx) {
  const { status, userAddress, raw } = ctx.query;
  const query = {
    where: {},
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0,
    order: [['id', 'DESC']],
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

async function summary(ctx) {
  ctx.body = {
    pending: await V1Content.count({ where: { status: 'pending' } }),
    done: await V1Content.count({ where: { status: 'done' } }),
  }
}

module.exports = router;
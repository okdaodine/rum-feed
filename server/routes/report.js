const router = require('koa-router')();
const Report = require('../database/sequelize/report');
const { assert, Errors } = require('../utils/validator');

router.get('/', list);
router.get('/:id', get);
router.post('/', create);

async function create(ctx) {
  const payload = ctx.request.body;
  assert(payload, Errors.ERR_IS_REQUIRED('reason'));
  assert(payload.reason, Errors.ERR_IS_REQUIRED('reason'));
  await Report.create(payload);
  ctx.body = true;
}

async function list(ctx) {
  const reports = await Report.findAll({
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0,
  })
  ctx.body = reports;
}

async function get(ctx) {
  const report = await Report.findOne({
    where: {
      id: ctx.params.id
    }
  });
  assert(report, Errors.ERR_NOT_FOUND('report'));
  ctx.body = report;
}

module.exports = router;
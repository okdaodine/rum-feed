const router = require('koa-router')();
const Report = require('../database/sequelize/report');
const { assert, Errors } = require('../utils/validator');
const config = require('../config');

router.get('/', list);
router.get('/reasons', listReasons);
router.post('/', create);

async function create(ctx) {
  const payload = ctx.request.body;
  assert(payload, Errors.ERR_IS_REQUIRED('reason'));
  assert(payload.reasonId, Errors.ERR_IS_REQUIRED('reasonId'));
  assert(payload.objectId, Errors.ERR_IS_REQUIRED('objectId'));
  const reportReasons = config.reportReasons || {};
  const ids = reportReasons.map(item => item.id);
  assert(ids.includes(payload.reasonId), Errors.ERR_IS_INVALID('reasonId'));
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

async function listReasons(ctx) {
  const reportReasons = config.reportReasons || {};
  ctx.body = reportReasons;
}

module.exports = router;
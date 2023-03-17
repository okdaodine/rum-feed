const router = require('koa-router')();
const { assert, Errors, throws } = require('../utils/validator');
const rumSDK = require('rum-sdk-nodejs');
const pendingTrxHelper = require('../utils/pendingTrxHelper');
const Content = require('../database/sequelize/content');

router.post('/', sendTrx);
router.get('/:trxId', get);

async function sendTrx(ctx) {
  const payload = ctx.request.body;
  assert(payload, Errors.ERR_IS_REQUIRED('payload'));
  try {
    const res = await rumSDK.chain.Trx.send(ctx.params.groupId, payload);
    pendingTrxHelper.save(ctx.params.groupId, res.trx_id);
    ctx.body = res;
  } catch (err) {
    console.log(err);
    const { status } = err.response || {};
    if (status > 200 && status < 500) {
      throws(Errors.ERR_NO_PERMISSION('request'));
    } else {
      throws(Errors.ERR_IS_REQUEST_FAILED());
    }
  }
}

async function get(ctx) {
  const content = await Content.findOne({
    attributes: { exclude: ['id', 'log', 'groupId', 'Data'] },
    where: { GroupId: ctx.params.groupId, TrxId: ctx.params.trxId }
  });
  assert(content, Errors.ERR_NOT_FOUND('trx'));
  ctx.body = content;
}

module.exports = router;
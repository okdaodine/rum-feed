const router = require('koa-router')();
const { assert, Errors, throws } = require('../utils/validator');
const rumSDK = require('rum-sdk-nodejs');
const pendingTrxHelper = require('../utils/pendingTrxHelper');

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
  try {
    ctx.body = await rumSDK.chain.Trx.get(ctx.params.groupId, ctx.params.trxId);
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

module.exports = router;
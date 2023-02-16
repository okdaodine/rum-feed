const router = require('koa-router')();
const Wallet = require('../database/sequelize/wallet');
const { assert, Errors } = require('../utils/validator');

router.get('/:providerAddress', get);

async function get(ctx) {
  const wallet = await Wallet.findOne({
    where: {
      providerAddress: ctx.params.providerAddress.toLowerCase()
    }
  });
  assert(wallet, Errors.ERR_NOT_FOUND('wallet'));
  ctx.body = wallet;
}

module.exports = router;
const router = require('koa-router')();
const Wallet = require('../database/sequelize/wallet');
const { assert, Errors } = require('../utils/validator');

router.get('/:address', get);
router.get('/provider/:providerAddress', getByProviderAddress);

async function get(ctx) {
  const wallet = await Wallet.findOne({
    where: {
      address: ctx.params.address
    }
  });
  assert(wallet, Errors.ERR_NOT_FOUND('wallet'));
  ctx.body = wallet;
}

async function getByProviderAddress(ctx) {
  const wallet = await Wallet.findOne({
    where: {
      providerAddress: ctx.params.providerAddress.toLowerCase()
    }
  });
  assert(wallet, Errors.ERR_NOT_FOUND('wallet'));
  ctx.body = wallet;
}

module.exports = router;
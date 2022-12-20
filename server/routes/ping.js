const router = require('koa-router')();

router.get('/', ping);

async function ping(ctx) {
  ctx.body = true;
}

module.exports = router;
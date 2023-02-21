const router = require('koa-router')();
const config = require('../config');

router.get('/', get);

async function get(ctx) {
  ctx.body = {
    title: config.title || '',
    logo: config.logo || '',
    defaultGroupId: config.defaultGroupId || '',
    repo: config.repo || ''
  };
}

module.exports = router;
const router = require('koa-router')();
const config = require('../config');

router.get('/', get);

async function get(ctx) {
  ctx.body = {
    siteName: config.siteName || '',
    logo: config.logo || '',
    defaultGroupId: config.defaultGroupId || '',
    repo: config.repo || '',
    groupsPageIsOnlyVisibleToAdmin: config.groupsPageIsOnlyVisibleToAdmin || false
  };
}

module.exports = router;
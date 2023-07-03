const router = require('koa-router')();
const config = require('../config');

router.get('/', get);

async function get(ctx) {
  ctx.body = {
    siteName: config.siteName || '',
    logo: config.logo || '',
    defaultGroupId: config.defaultGroupId || '',
    repo: config.repo || '',
    hasAdmin: config.admins?.length > 0,
    groupsPageIsOnlyVisibleToAdmin: config.groupsPageIsOnlyVisibleToAdmin || false,
    walletProviders: config.walletProviders || [],
    supportAccountPubKey: config.supportAccountPubKey || '',
    enabledV1Migration: config.enabledV1Migration || false,
    enabledVideo: config.enabledVideo || false,
  };
}

module.exports = router;
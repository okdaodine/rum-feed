const router = require('koa-router')();
const axios = require('axios');
const config = require('../config');
const rumSDK = require('rum-sdk-nodejs');
const { RumFullNodeClient } = require('rum-fullnode-sdk');
const { assert, Errors } = require('../utils/validator');
const nftUtils = require('../utils/nft');
const logger = require('../utils/logger');

router.get('/:pubKey', get);
router.post('/:pubKey', tryAdd);

const rumClient = RumFullNodeClient(config.fullnode);

async function get(ctx) {
  const { groupId, pubKey } = ctx.params;
  const allow = await getChainAuth(groupId, pubKey);
  logger.info(`[getAllow]:`)
  logger.info({ allow });
  assert(allow, Errors.ERR_NOT_FOUND('allow'));
  ctx.body = true;
}

async function tryAdd(ctx) {
  const { groupId, pubKey } = ctx.params;
  const provider = ctx.query.provider || 'mixin';
  const accessToken = ctx.query.access_token;
  assert(accessToken, Errors.ERR_IS_REQUIRED('accessToken'));
  logger.info(`[tryAdd query]:`)
  logger.info({ provider, accessToken });
  let nft;
  if (provider === 'mixin') {
    const userId = await nftUtils.mixin.getUserId(accessToken);
    logger.info(`nftUtils.mixin.getUserId:`)
    logger.info({ userId });
    assert(userId, Errors.ERR_NOT_FOUND('userId'));
    const nftInfo = await nftUtils.mixin.getNFT(userId, accessToken, config.nft.collection_id);
    logger.info(`[nftUtils.mixin.getNFT]:`)
    logger.info({ nftInfo });
    assert(nftInfo, Errors.ERR_NOT_FOUND(`${JSON.stringify(config.nft)} nft`));
    nft = {
      collection_id: nftInfo.collection_id,
      meta: {
        description: nftInfo.meta.description,
        hash: nftInfo.meta.hash,
        icon_url: nftInfo.meta.icon_url,
        name: nftInfo.meta.name
      }
    }
    logger.info({ nft });
  }
  if (provider === 'web3') {
    const address = await getOriginalVaultAddress(accessToken);
    assert(address, Errors.ERR_NOT_FOUND('address'));
    const nftInfo = await nftUtils.mvm.getNFTFromExplorer(address, config.nft.collection_id);
    logger.info(`[nftUtils.mvm.getNFTFromExplorer]:`)
    logger.info({ nftInfo });
    assert(nftInfo, Errors.ERR_NOT_FOUND(`${JSON.stringify(config.nft)} nft`));
    nft = {
      collection_id: nftInfo.collection.id,
      meta: {
        description: nftInfo.token.description,
        hash: nftInfo.token.media.hash,
        icon_url: nftInfo.token.icon.url,
        name: nftInfo.token.name
      }
    }
    logger.info({ nft });
  }
  const allow = await getChainAuth(groupId, pubKey);
  if (allow) {
    ctx.body = { nft, allow };
  } else {
    await updateChainAuth(ctx.params.groupId, ctx.params.pubKey, 'add');
    ctx.body = { nft };
  }
}

const getChainAuth = async (groupId, pubKey) => {
  try {
    const group = rumSDK.cache.Group.get(groupId);
    assert(group, Errors.ERR_NOT_FOUND('group'));
    const allowList = await rumClient.Auth.getAllowList(groupId) || [];
    return allowList.find(item => item.Pubkey === pubKey) || null;
  } catch (err) {
    logger.info(err);
    return null;
  }
}

const updateChainAuth = async (groupId, pubKey, action) => {
  try {
    const group = rumSDK.cache.Group.get(groupId);
    assert(group, Errors.ERR_NOT_FOUND('group'));
    const res = await rumClient.Auth.updateChainConfig({
      group_id: groupId,
      type: 'upd_alw_list',
      config: {
        action,
        pubkey: pubKey,
        trx_type: ['post'],
        memo: ''
      }
    });
    logger.info(`[updateChainAuth]:`)
    logger.info({ 'res': res });
    return true;
  } catch (err) {
    logger.info(err);
    return false;
  }
}

const getPresetGroup = groupId => {
  const presetGroups = Object.values(config.presetGroup);
  return presetGroups.find(presetGroup => {
    const group = rumSDK.utils.seedUrlToGroup(presetGroup.seed);
    return groupId === group.groupId;
  });
}

const getOriginalVaultAddress = async (token) => {
  try {
    assert(token, Errors.ERR_IS_REQUIRED('token'));
    const res = await axios.get(`https://vault.rumsystem.net/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.eth_address_user.address;
  } catch (err) {
    logger.info(err);
    return '';
  }
}

module.exports = router;
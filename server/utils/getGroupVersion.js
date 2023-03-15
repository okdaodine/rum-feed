const rumSDK = require('rum-sdk-nodejs');

module.exports = group => {
  const { appKey } = rumSDK.utils.seedUrlToGroup(group.seedUrl);
  return appKey.includes('v1') ? 'v1' : 'v2';
}
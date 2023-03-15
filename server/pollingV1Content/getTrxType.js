const QuorumLightNodeSDK = require('quorum-light-node-sdk-nodejs');

module.exports = (item) => {
  const group = QuorumLightNodeSDK.cache.Group.get(item.GroupId);
  if (group?.appKey === 'group_relations') {
    return 'relation';
  }
  if (item.Data.type === 'Note' && !item.Data.inreplyto) {
    return 'post';
  }
  if (item.Data.type === 'Note' && !!item.Data.inreplyto) {
    return 'comment';
  }
  if (['Like', 'Dislike'].includes(item.Data.type)) {
    return 'counter';
  }
  if (Object.keys(item.Data).includes('name') || Object.keys(item.Data).includes('image')) {
    return 'profile';
  }
};
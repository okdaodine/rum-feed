const rumsdk = require('rum-sdk-nodejs');

module.exports = (item) => {
  const group = rumsdk.cache.Group.get(item.GroupId);
  if (group?.appKey === 'group_relations') {
    return 'relation';
  }
  const { type, object, result } = item.Data;
  if (type === 'Create' && object.type === 'Note' && !object.inreplyto) {
    return 'post';
  }
  if (type === 'Create' && object.type === 'Note' && object.inreplyto && object.inreplyto.type === 'Note') {
    return 'comment';
  }
  if (type === 'Like' || type === 'Dislike') {
    return 'counter';
  }
  if (type === 'Create' && object.type === 'Person') {
    return 'profile';
  }
  if (type === 'Delete' && object.type === 'Note') {
    return 'delete';
  }
  if (type === 'Update' && object.type === 'Note' && result?.type === 'Note') {
    return 'edit';
  }
  // if (item.Data.type === 'Note' && !item.Data.inreplyto) {
  //   return 'post';
  // }
  // if (item.Data.type === 'Note' && !!item.Data.inreplyto) {
  //   return 'comment';
  // }
  // if (['Like', 'Dislike'].includes(item.Data.type)) {
  //   return 'counter';
  // }
  // if (Object.keys(item.Data).includes('name') || Object.keys(item.Data).includes('image')) {
  //   return 'profile';
  // }
};
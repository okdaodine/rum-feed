module.exports = (item) => {
  const { type, object } = item.Data;
  if (type === 'Create' && object.type === 'Note' && !object.inreplyto) {
    return 'post';
  }
  if (type === 'Create' && object.type === 'Note' && object.inreplyto && object.inreplyto.type === 'Note') {
    return 'comment';
  }
  if (type === 'Like' || (type === 'Undo' && object.type === 'Like')) {
    return 'counter';
  }
  if (type === 'Create' && object.type === 'Profile') {
    return 'profile';
  }
  if (type === 'Delete' && object.type === 'Note') {
    return 'delete';
  }
  if (type === 'Follow' || (type === 'Undo' && object.type === 'Follow') || type === 'Block' || (type === 'Undo' && object.type === 'Block')) {
    return 'relation';
  }
  if (type === 'Favorite' || (type === 'Undo' && object.type === 'Favorite')) {
    return 'favorite';
  }
  if (type === 'CreateDirectMessage') {
    return 'directMessage';
  }
  if (type === 'Create' && object.type === 'Video') {
    return 'video';
  }
};
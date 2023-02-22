module.exports = (item) => {
  const { type, object, result } = item.Data;
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
  if (type === 'Update' && object.type === 'Note' && result?.type === 'Note') {
    return 'edit';
  }
  if (type === 'Follow' || (type === 'Undo' && object.type === 'Follow') || type === 'Block' || (type === 'Undo' && object.type === 'Block')) {
    return 'relation';
  }
  if (type === 'Announce' && object.name.includes('private key')) {
    return 'wallet';
  }
};
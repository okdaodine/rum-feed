module.exports = (item) => {
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
  if (type === 'Follow' || (type === 'Undo' && object.type === 'Follow') || type === 'Block' || (type === 'Undo' && object.type === 'Block')) {
    return 'relation';
  }
};
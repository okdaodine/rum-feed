module.exports = group => {
  if (group.groupName.startsWith('mixin.')) {
    return 'v2';
  }
  return 'v1';
}
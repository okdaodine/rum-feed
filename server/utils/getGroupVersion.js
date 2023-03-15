module.exports = group => {
  return group.groupName.includes('v1') ? 'v1' : 'v2';
}
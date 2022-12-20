module.exports = (userAddress) => ({
  userAddress,
  name: userAddress.slice(-8),
  avatar: 'https://static-assets.pek3b.qingstor.com/rum-avatars/default.png',
});
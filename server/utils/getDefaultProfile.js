const config = require('../config');

module.exports = (userAddress) => ({
  userAddress,
  name: userAddress.slice(-8),
  avatar: `${config.serverOrigin || config.origin || ''}/api/images/profiles/${userAddress}`
});
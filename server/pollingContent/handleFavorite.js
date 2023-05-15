const Favorite = require('../database/sequelize/favorite');
const rumSDK = require('rum-sdk-nodejs');

module.exports = async (item) => {
  const {
    GroupId,
    Data: {
      type,
      object,
    },
    SenderPubkey,
  } = item;
  const userAddress = rumSDK.utils.pubkeyToAddress(SenderPubkey);

  if (type === 'Favorite') {
    await Favorite.findOrCreate({
      where: {
        groupId: GroupId,
        userAddress,
        objectType: 'post',
        objectId: object.id,
      }
    });
  }

  if (type === 'Undo' && item.Data.object.type === 'Favorite') {
    const favorite = item.Data.object;
    await Favorite.destroy({
      where: {
        groupId: GroupId,
        userAddress,
        objectType: 'post',
        objectId: favorite.object.id,
      }
    });
  }
}

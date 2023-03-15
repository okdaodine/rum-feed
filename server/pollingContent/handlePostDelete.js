const Post = require('../database/post');
const rumSDK = require('rum-sdk-nodejs');
const Orphan = require('../database/sequelize/orphan');

module.exports = async (item) => {
  const {
    Data: {
      object: {
        id,
      }
    },
    SenderPubkey,
  } = item;

  const userAddress = rumSDK.utils.pubkeyToAddress(SenderPubkey);
  const deletedPost = await Post.get(id);
  if (!deletedPost) {
    await Orphan.create({
      content: item,
      groupId: item.GroupId,
      parentId: `${id}`,
    });
    throw new Error('Orphan');
  }
  if (userAddress !== deletedPost.userAddress) {
    return;
  }
  await Post.destroy(id);
  return;
}

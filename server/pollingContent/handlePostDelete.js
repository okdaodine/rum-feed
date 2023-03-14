const Post = require('../database/post');
const rumSDK = require('rum-sdk-nodejs');

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
    return;
  }
  if (userAddress !== deletedPost.userAddress) {
    return;
  }
  await Post.destroy(id);
  return;
}

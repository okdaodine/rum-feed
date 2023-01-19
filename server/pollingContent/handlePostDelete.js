const Post = require('../database/post');
const rumsdk = require('rum-sdk-nodejs');

module.exports = async (item, group) => {
  const {
    Data: {
      object: {
        id,
      }
    },
    SenderPubkey,
  } = item;

  const userAddress = rumsdk.utils.pubkeyToAddress(SenderPubkey);
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

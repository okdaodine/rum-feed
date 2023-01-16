const Post = require('../database/post');
const Comment = require('../database/comment');
const UniqueCounter = require('../database/uniqueCounter');
const rumsdk = require('rum-sdk-nodejs');
const { getSocketIo } = require('../socket');
const config = require('../config');
const Mixin = require('../mixin');
const truncateByBytes = require('../utils/truncateByBytes');

module.exports = async (item, group) => {
  const post = await pack(item);

  // if (extra.updatedTrxId) {
  //   const updatedPost = await Post.get(extra.updatedTrxId);
  //   if (!updatedPost) {
  //     return;
  //   }
  //   if (post.userAddress !== updatedPost.userAddress) {
  //     return;
  //   }
  //   await Post.create({
  //     ...post,
  //     latestTrxId: '',
  //     commentCount: updatedPost.commentCount,
  //     hotCount: updatedPost.hotCount,
  //     likeCount: updatedPost.likeCount,
  //     timestamp: updatedPost.timestamp,
  //   });
  //   await Post.update(updatedPost.trxId, {
  //     latestTrxId: post.trxId
  //   });
  //   await Post.replaceUpdatedTrxId(updatedPost.trxId, post.trxId);
  //   await Comment.replaceObjectId(updatedPost.trxId, post.trxId);
  //   await UniqueCounter.replaceObjectId(updatedPost.trxId, post.trxId);
  //   if (group.loaded) {
  //     await notify(post.trxId);
  //   }
  //   return;
  // }
  // if (extra.deletedTrxId) {
  //   const deletedPost = await Post.get(extra.deletedTrxId);
  //   if (!deletedPost) {
  //     return;
  //   }
  //   if (post.userAddress !== deletedPost.userAddress) {
  //     return;
  //   }
  //   await Post.destroy(extra.deletedTrxId);
  //   return;
  // }
  await Post.create(post);
  if (group.loaded) {
    await notify(post.id);
  }
}

const pack = async item => {
  const {
    TrxId,
    Data: {
      object: {
        id,
        name,
        content,
        image,
      }
    },
    SenderPubkey,
    TimeStamp,
  } = item;
  const post = {
    content,
    title: name || '',
    userAddress: rumsdk.utils.pubkeyToAddress(SenderPubkey),
    groupId: item.GroupId,
    trxId: TrxId,
    id,
    latestTrxId: '',
    storage: 'chain',
    commentCount: 0,
    hotCount: 0,
    likeCount: 0,
    timestamp: parseInt(String(TimeStamp / 1000000), 10)
  }
  if (image) {
    post.images = image.map(v => ({
      ...v,
      content: Buffer.from(v.content, 'base64').toString(),
    }));
    post.imageCount = image.length;
  }
  // const extra = {};
  // if (id) {
  //   if (content === 'OBJECT_STATUS_DELETED') {
  //     extra.deletedTrxId = id;
  //   } else {
  //     extra.updatedTrxId = id;
  //   }
  // }
  return post
}

const notify = async (id) => {
  const post = await Post.get(id, {
    withReplacedImage: true,
    withExtra: true
  });
  if (post) {
    getSocketIo().emit('post', post);
    const name = post.extra.userProfile.name.split('\n')[0];
    Mixin.notifyByBot({
      iconUrl: post.extra.userProfile.avatar,
      title: (post.content || '').slice(0, 30) || '图片',
      description: `${truncateByBytes(name, 14)} 发布内容`,
      url: `${config.origin}/posts/${post.id}`
    });
  }
}

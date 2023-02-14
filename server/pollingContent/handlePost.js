const Post = require('../database/post');
const rumSDK = require('rum-sdk-nodejs');
const { getSocketIo } = require('../socket');
const config = require('../config');
const Mixin = require('../mixin');
const truncateByBytes = require('../utils/truncateByBytes');

module.exports = async (item, group) => {
  const post = await pack(item);
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
    userAddress: rumSDK.utils.pubkeyToAddress(SenderPubkey),
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
  if (image && Array.isArray(image)) {
    post.images = image;
    post.imageCount = image.length;
  }
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
      title: (post.content || '').slice(0, 30) || 'Image',
      description: truncateByBytes(name, 14),
      url: `${config.origin}/posts/${post.id}`
    });
  }
}

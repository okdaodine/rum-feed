const rumSDK = require('rum-sdk-nodejs');
const Post = require('../database/post');
const { getSocketIo } = require('../socket');
const config = require('../config');
const Mixin = require('../mixin');
const truncateByBytes = require('../utils/truncateByBytes');
const within24Hours = require('../utils/within24Hours');

module.exports = async (item, group) => {
  const post = await pack(item);
  if (!post.id) {
    return;
  }
  const exist = await Post.get(post.id);
  if (exist) {
    return;
  }
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
    storage: 'chain',
    commentCount: 0,
    likeCount: 0,
    timestamp: parseInt(String(TimeStamp / 1000000), 10)
  }
  if (image) {
    const images = Array.isArray(image) ? image : [image];
    post.images = images;
    post.imageCount = images.length;
  }
  return post
}

const notify = async (id) => {
  const post = await Post.get(id, {
    withReplacedImage: true,
    withExtra: true
  });
  if (post) {
    if (within24Hours(post.timestamp)) {  
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
}

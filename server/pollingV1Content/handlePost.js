const Post = require('../database/post');
const Comment = require('../database/comment');
const UniqueCounter = require('../database/uniqueCounter');
const rumSDK = require('rum-sdk-nodejs');
const { getSocketIo } = require('../socket');
const config = require('../config');
const Mixin = require('../mixin');
const truncateByBytes = require('../utils/truncateByBytes');
const V1Content = require('../database/v1Content');

module.exports = async (item, group) => {
  const { post, extra } = await pack(item);

  if (extra.updatedTrxId) {
    return;
  }
  if (extra.deletedTrxId) {
    const deletedPost = await Post.get(extra.deletedTrxId);
    if (!deletedPost) {
      return;
    }
    if (post.userAddress !== deletedPost.userAddress) {
      return;
    }
    await Post.destroy(extra.deletedTrxId);
    await V1Content.create({
      data: {
        type: 'Delete',
        object: {
          type: 'Note',
          id: extra.deletedTrxId,
        },
      },
      trxId: item.TrxId,
      groupId: item.GroupId,
      raw: item,
      userAddress: post.userAddress,
      status: 'pending'
    });
    return;
  }
  post.likeCount = await UniqueCounter.count({
    where: {
      objectId: post.trxId
    }
  });
  post.commentCount = await Comment.count({
    where: {
      objectId: post.trxId
    }
  });
  await Post.create(post);
  await V1Content.create({
    data: {
      type: 'Create',
      object: {
        type: 'Note',
        id: post.id,
        content: post.content,
        ...(
          post.title ?
          { name: post.title } :
          {}
        ),
        ...(
          post.images ?
          { image: post.images.map(image => ({ type: 'Image', ...image })) } :
          {}
        )
      },
    },
    trxId: item.TrxId,
    groupId: item.GroupId,
    raw: item,
    userAddress: post.userAddress,
    status: 'pending'
  });
  if (group.loaded) {
    await notify(post.id);
  }
}

const pack = async item => {
  const {
    id,
    content,
    image,
    name
  } = item.Data;
  const post = {
    content,
    title: name || '',
    userAddress: rumSDK.utils.pubkeyToAddress(item.SenderPubkey),
    groupId: item.GroupId,
    trxId: item.TrxId,
    id: item.TrxId,
    storage: 'chain',
    commentCount: 0,
    likeCount: 0,
    timestamp: parseInt(String(item.TimeStamp / 1000000), 10)
  }
  if (image) {
    post.images = image;
    post.imageCount = image.length;
  }
  const extra = {};
  if (id) {
    if (content === 'OBJECT_STATUS_DELETED') {
      extra.deletedTrxId = id;
    } else {
      extra.updatedTrxId = id;
    }
  }
  return {
    post,
    extra
  };
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


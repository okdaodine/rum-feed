const UniqueCounter = require('../database/uniqueCounter');
const Post = require('../database/post');
const Comment = require('../database/comment');
const Notification = require('../database/notification');
const rumSDK = require('rum-sdk-nodejs');
const { trySendSocket } = require('../socket');
const V1Content = require('../database/v1Content');

const CounterName = {
  postLike: 'postLike',
  commentLike: 'commentLike',
}

module.exports = async (item, group) => {
  const counter = await pack(item);

  if (!counter) {
    return;
  }

  const { objectId, value, name } = counter;
  const from = counter.userAddress;
  const uniqueCounter = {
    name,
    objectId,
    userAddress: from
  };
  if (value > 0) {
    await UniqueCounter.upsert(uniqueCounter);
    await V1Content.create({
      data: {
        type: 'Like',
        object: {
          type: 'Note',
          id: objectId,
        },
      },
      trxId: item.TrxId,
      groupId: item.GroupId,
      raw: item,
      userAddress: from,
      status: 'pending'
    });
  } else if (value < 0) {
    await UniqueCounter.destroy(uniqueCounter);
    await V1Content.create({
      data: {
        type: 'Undo',
        object: {
          type: 'Like',
          object: {
            type: 'Note',
            id: objectId,
          },
        }
      },
      trxId: item.TrxId,
      groupId: item.GroupId,
      raw: item,
      userAddress: from,
      status: 'pending'
    });
  }


  const post = await Post.get(objectId);
  if (post) {
    const count = await UniqueCounter.count({
      where: {
        objectId: post.trxId
      }
    });
    if (name === CounterName.postLike) {
      post.likeCount = count;
    }
    await Post.update(post.trxId, post);
    if (value > 0 && from !== post.userAddress) {
      const notification = {
        groupId: '',
        status: 'read',
        type: 'like',
        toObjectId: post.trxId,
        toObjectType: 'post',
        to: post.userAddress,
        from,
        fromObjectId: '',
        fromObjectType: '',
        timestamp: parseInt(String(item.TimeStamp / 1000000), 10)
      };
      await Notification.create(notification);
      if (group.loaded) {
        trySendSocket(notification.to, 'notification', notification);
      }
    }
  }

  const comment = await Comment.get(objectId);
  if (comment) {
    const count = await UniqueCounter.count({
      where: {
        objectId: comment.trxId
      }
    });
    if (name === CounterName.commentLike) {
      comment.likeCount = count;
    }
    await Comment.update(comment.trxId, comment);
    if (value > 0 && from !== comment.userAddress) {
      const notification = {
        groupId: '',
        status: 'read',
        type: 'like',
        toObjectId: comment.trxId,
        toObjectType: 'comment',
        to: comment.userAddress,
        from,
        fromObjectId: '',
        fromObjectType: '',
        timestamp: parseInt(String(item.TimeStamp / 1000000), 10)
      };
      await Notification.create(notification);
      if (group.loaded) {
        trySendSocket(notification.to, 'notification', notification);
      }
    }
  }
}

const pack = async (item) => {
  const { id, type } = item.Data;
  const data = {
    objectId: id,
    value: type === 'Like' ? 1 : -1,
    name: 'like',
    userAddress: rumSDK.utils.pubkeyToAddress(item.SenderPubkey),
    groupId: item.GroupId,
    trxId: item.TrxId
  }
  const post = await Post.get(id);
  const comment = await Comment.get(id);
  if (post) {
    data.name = CounterName.postLike;
  } else if (comment) {
    data.name = CounterName.commentLike;
  }
  return data;
}
const UniqueCounter = require('../database/uniqueCounter');
const Post = require('../database/post');
const Comment = require('../database/comment');
const Notification = require('../database/notification');
const rumSDK = require('rum-sdk-nodejs');
const { trySendSocket } = require('../socket');
const Orphan = require('../database/sequelize/orphan');
const within24Hours = require('../utils/within24Hours');

const CounterName = {
  postLike: 'postLike',
  commentLike: 'commentLike',
}

module.exports = async (item, group) => {
  const counter = await pack(item);

  if (!counter) {
    const { Data: { type, object } } = item;
    const id = type === 'Undo' ? object.object.id : object.id;
    await Orphan.create({
      content: item,
      groupId: item.GroupId,
      parentId: `${id}`
    });
    throw new Error('Orphan');
  }

  const { objectId, value, name, timestamp } = counter;
  const from = counter.userAddress;
  const uniqueCounter = {
    objectId,
    userAddress: from
  };
  if (value > 0) {
    await UniqueCounter.upsert(uniqueCounter);
  } else if (value < 0) {
    await UniqueCounter.destroy(uniqueCounter);
  }

  if (name === CounterName.postLike) {
    const post = await Post.get(objectId);
    if (post) {
      const count = await UniqueCounter.count({
        where: {
          objectId: post.id
        }
      });
      post.likeCount = count;
      await Post.update(post.id, post);
      if (value > 0 && from !== post.userAddress) {
        const notification = {
          groupId: '',
          status: group.loaded && within24Hours(timestamp) ? 'unread' : 'read',
          type: 'like',
          toObjectId: post.id,
          toObjectType: 'post',
          to: post.userAddress,
          from,
          fromObjectId: '',
          fromObjectType: '',
          timestamp
        };
        await Notification.create(notification);
        if (group.loaded) {
          trySendSocket(notification.to, 'notification', notification);
        }
      }
    }
  }

  if (name === CounterName.commentLike) {
    const comment = await Comment.get(objectId);
    if (comment) {
      const count = await UniqueCounter.count({
        where: {
          objectId: comment.id
        }
      });
      comment.likeCount = count;
      await Comment.update(comment.id, comment);
      if (value > 0 && from !== comment.userAddress) {
        const notification = {
          groupId: '',
          status: group.loaded && within24Hours(timestamp) ? 'unread' : 'read',
          type: 'like',
          toObjectId: comment.id,
          toObjectType: 'comment',
          to: comment.userAddress,
          from,
          fromObjectId: '',
          fromObjectType: '',
          timestamp
        };
        await Notification.create(notification);
        if (group.loaded) {
          trySendSocket(notification.to, 'notification', notification);
        }
      }
    }
  }
}

const pack = async (item) => {
  const {
    TrxId,
    Data: {
      type,
      object
    },
    SenderPubkey,
    GroupId,
    TimeStamp,
  } = item;
  const id = type === 'Undo' ? object.object.id : object.id;
  const data = {
    objectId: id,
    value: type === 'Undo' ? -1 : 1,
    name: '',
    userAddress: rumSDK.utils.pubkeyToAddress(SenderPubkey),
    groupId: GroupId,
    trxId: TrxId,
    timestamp: parseInt(String(TimeStamp / 1000000), 10)
  }
  const post = await Post.get(id);
  const comment = await Comment.get(id);
  if (post) {
    data.name = CounterName.postLike;
  } else if (comment) {
    data.name = CounterName.commentLike;
  } else {
    return null;
  }
  return data;
}
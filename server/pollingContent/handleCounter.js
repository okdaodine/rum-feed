const UniqueCounter = require('../database/uniqueCounter');
const Post = require('../database/post');
const Comment = require('../database/comment');
const Notification = require('../database/notification');
const rumsdk = require('rum-sdk-nodejs');
const { trySendSocket } = require('../socket');

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
  } else if (value < 0) {
    await UniqueCounter.destroy(uniqueCounter);
  }
  console.log(name)

  if (name.startsWith('post')) {
    const post = await Post.get(objectId);
    console.log(post)
    if (post) {
      const count = await UniqueCounter.count({
        where: {
          name,
          objectId: post.id
        }
      });
      if (name === CounterName.postLike) {
        post.likeCount = count;
      }
      await Post.update(post.id, post);
    }
    if (value > 0 && from !== post.userAddress) {
      const notification = {
        groupId: '',
        status: group.loaded ? 'unread' : 'read',
        type: 'like',
        toObjectId: post.id,
        toObjectType: 'post',
        to: post.userAddress,
        from,
        fromObjectId: '',
        fromObjectType: '',
        timestamp: Date.now()
      };
      await Notification.create(notification);
      if (group.loaded) {
        trySendSocket(notification.to, 'notification', notification);
      }
    }
  }

  if (name.startsWith('comment')) {
    const comment = await Comment.get(objectId);
    if (!comment) {
      return;
    }
    const count = await UniqueCounter.count({
      where: {
        name,
        objectId: comment.id
      }
    });
    if (name === CounterName.commentLike) {
      comment.likeCount = count;
    }
    await Comment.update(comment.id, comment);
    if (value > 0 && from !== comment.userAddress) {
      const notification = {
        groupId: '',
        status: group.loaded ? 'unread' : 'read',
        type: 'like',
        toObjectId: comment.id,
        toObjectType: 'comment',
        to: comment.userAddress,
        from,
        fromObjectId: '',
        fromObjectType: '',
        timestamp: Date.now()
      };
      await Notification.create(notification);
      if (group.loaded) {
        trySendSocket(notification.to, 'notification', notification);
      }
    }
  }
}

const pack = async (item) => {
  const {
    TrxId,
    Data: {
      type,
      object: {
        id,
      }
    },
    SenderPubkey,
    GroupId,
  } = item;
  const data = {
    objectId: id,
    value: type === 'Like' ? 1 : -1,
    name: '',
    userAddress: rumsdk.utils.pubkeyToAddress(SenderPubkey),
    groupId: GroupId,
    trxId: TrxId
  }
  const post = await Post.get(id);
  const comment = await Comment.get(id);
  console.log(id)
  console.log(post)
  if (post) {
    data.name = 'postLike';
  } else if (comment) {
    data.name = 'commentLike';
  } else {
    return null;
  }
  return data;
}
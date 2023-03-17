const Post = require('../database/post');
const Comment = require('../database/comment');
const Notification = require('../database/notification');
const rumSDK = require('rum-sdk-nodejs');
const { trySendSocket } = require('../socket');
const UniqueCounter = require('../database/uniqueCounter');
const V1Content = require('../database/v1Content');

module.exports = async (item, group) => {
  const comment = await pack(item);

  if (!comment) {
    return;
  }

  comment.likeCount = await UniqueCounter.count({
    where: {
      objectId: comment.trxId
    }
  });
  comment.commentCount = await Comment.count({
    where: {
      threadId: comment.trxId
    }
  });
  await Comment.create(comment);
  await V1Content.create({
    data: {
      type: 'Create',
      object: {
        type: 'Note',
        id: comment.trxId,
        content: comment.content,
        ...(
          comment.images ?
          { image: comment.images.map(image => ({ type: 'Image', ...image })) } :
          {}
        ),
        inreplyto: {
          type: 'Note',
          id: item.Data.inreplyto.trxid,
        },
      }
    },
    trxId: item.TrxId,
    groupId: item.GroupId,
    raw: item,
    userAddress: comment.userAddress,
    status: 'pending'
  });

  const { objectId, threadId, replyId } = comment;
  const from = comment.userAddress;

  const post = await Post.get(objectId);
  if (post) {
    post.commentCount = await Comment.count({
      where: {
        objectId: post.trxId
      }
    });
    await Post.update(post.trxId, post);
    if (!threadId && from !== post.userAddress) {
      const notification = {
        groupId: '',
        status: 'read',
        type: 'comment',
        to: post.userAddress,
        toObjectId: post.trxId,
        toObjectType: 'post',
        from,
        fromObjectId: comment.trxId,
        fromObjectType: 'comment',
        timestamp: comment.timestamp
      };
      await Notification.create(notification);
      if (group.loaded) {
        trySendSocket(notification.to, 'notification', notification);
      }
    }
  }

  if (threadId) {
    const threadComment = await Comment.get(threadId);
    if (!threadComment) {
      return;
    }
    threadComment.commentCount = await Comment.count({
      where: {
        threadId: threadComment.trxId
      }
    });
    await Comment.update(threadComment.trxId, threadComment);
    if (replyId) {
      const replyComment = await Comment.get(replyId);
      if (!replyComment) {
        return;
      }
      if (from !== replyComment.userAddress) {
        const notification = {
          groupId: '',
          status: 'read',
          type: 'comment',
          to: replyComment.userAddress,
          toObjectId: replyComment.trxId,
          toObjectType: 'comment',
          from,
          fromObjectId: comment.trxId,
          fromObjectType: 'comment',
          timestamp: comment.timestamp
        };
        await Notification.create(notification);
        if (group.loaded) {
          trySendSocket(notification.to, 'notification', notification);
        }
      }
    } else {
      if (from !== threadComment.userAddress) {
        const notification = {
          groupId: '',
          status: 'read',
          type: 'comment',
          toObjectId: threadComment.trxId,
          toObjectType: 'comment',
          to: threadComment.userAddress,
          from,
          fromObjectId: comment.trxId,
          fromObjectType: 'comment',
          timestamp: comment.timestamp
        };
        await Notification.create(notification);
        if (group.loaded) {
          trySendSocket(notification.to, 'notification', notification);
        }
      }
    }
  }
}

const pack = async item => {
  const {
    content,
    image,
    inreplyto,
  } = item.Data;
  const comment = {
    content,
    objectId: '',
    threadId: '',
    replyId: '',
    userAddress: rumSDK.utils.pubkeyToAddress(item.SenderPubkey),
    groupId: item.GroupId,
    trxId: item.TrxId,
    id: item.TrxId,
    storage: 'chain',
    commentCount: 0,
    likeCount: 0,
    timestamp: parseInt(String(item.TimeStamp / 1000000), 10)
  };
  if (image) {
    comment.images = image;
    comment.imageCount = image.length;
  }
  if (inreplyto) {
    const toTrxId = inreplyto.trxid;
    const toComment = await Comment.get(toTrxId);
    if (toComment) {
      comment.objectId = toComment.objectId;
      if (toComment.threadId) {
        comment.threadId = toComment.threadId;
        comment.replyId = toComment.trxId;
      } else {
        comment.threadId = toComment.trxId;
      }
    } else {
      comment.objectId = toTrxId;
    }
  }
  return comment;
}

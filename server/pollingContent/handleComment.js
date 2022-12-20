const Post = require('../database/post');
const Comment = require('../database/comment');
const Notification = require('../database/notification');
const QuorumLightNodeSDK = require('quorum-light-node-sdk-nodejs');
const { trySendSocket } = require('../socket');
const { getSocketIo } = require('../socket');
const config = require('../config');
const Mixin = require('../mixin');
const truncateByBytes = require('../utils/truncateByBytes');

module.exports = async (item, group) => {
  const comment = await pack(item);

  if (!comment) {
    return;
  }

  await Comment.create(comment);

  if (group.loaded) {
    await notify(comment.trxId);
  }

  const { objectId, threadId, replyId } = comment;
  const from = comment.userAddress;

  const post = await Post.get(objectId);
  if (!post) {
    return;
  }
  post.commentCount = await Comment.count({
    where: {
      groupId: post.groupId,
      objectId: post.trxId
    }
  });
  await Post.update(post.trxId, post);
  if (!threadId && from !== post.userAddress) {
    const notification = {
      groupId: '',
      status: group.loaded ?'unread' : 'read',
      type: 'comment',
      to: post.userAddress,
      toObjectId: post.trxId,
      toObjectType: 'post',
      from,
      fromObjectId: comment.trxId,
      fromObjectType: 'comment',
      timestamp: Date.now()
    };
    await Notification.create(notification);
    if (group.loaded) {
      trySendSocket(notification.to, 'notification', notification);
    }
  }

  if (threadId) {
    const threadComment = await Comment.get(threadId);
    if (!threadComment) {
      return;
    }
    threadComment.commentCount = await Comment.count({
      where: {
        groupId: threadComment.groupId,
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
          status: group.loaded ?'unread' : 'read',
          type: 'comment',
          to: replyComment.userAddress,
          toObjectId: replyComment.trxId,
          toObjectType: 'comment',
          from,
          fromObjectId: comment.trxId,
          fromObjectType: 'comment',
          timestamp: Date.now()
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
          status: group.loaded ?'unread' : 'read',
          type: 'comment',
          toObjectId: threadComment.trxId,
          toObjectType: 'comment',
          to: threadComment.userAddress,
          from,
          fromObjectId: comment.trxId,
          fromObjectType: 'comment',
          timestamp: Date.now()
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
    userAddress: QuorumLightNodeSDK.utils.pubkeyToAddress(item.SenderPubkey),
    groupId: item.GroupId,
    trxId: item.TrxId,
    storage: 'chain',
    commentCount: 0,
    hotCount: 0,
    likeCount: 0,
    timestamp: parseInt(String(item.TimeStamp / 1000000), 10)
  };
  if (image) {
    comment.images = image;
    comment.imageCount = image.length;
  }
  if (inreplyto) {
    const toTrxId = inreplyto.trxid;
    const toPost = await Post.get(toTrxId);
    const toComment = await Comment.get(toTrxId);
    if (toPost) {
      comment.objectId = toPost.trxId;
    } else if (toComment) {
      comment.objectId = toComment.objectId;
      if (toComment.threadId) {
        comment.threadId = toComment.threadId;
        comment.replyId = toComment.trxId;
      } else {
        comment.threadId = toComment.trxId;
      }
    } else {
      return null;
    }
  }
  return comment;
}

const notify = async (trxId) => {
  const comment = await Comment.get(trxId, {
    withReplacedImage: true,
    withExtra: true
  });
  if (comment) {
    getSocketIo().emit('comment', comment);
    const name = comment.extra.userProfile.name.split('\n')[0];
    Mixin.notifyByBot({
      iconUrl: comment.extra.userProfile.avatar,
      title: (comment.content || '').slice(0, 30) || '图片',
      description: `${truncateByBytes(name, 14)} 发布评论`,
      url: `${config.origin}/posts/${comment.objectId}?commentId=${comment.trxId}`
    });
  }
}
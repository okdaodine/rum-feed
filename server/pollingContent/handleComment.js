const Post = require('../database/post');
const Comment = require('../database/comment');
const Notification = require('../database/notification');
const rumsdk = require('rum-sdk-nodejs');
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
    await notify(comment.id);
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
      objectId: post.id
    }
  });
  await Post.update(post.id, post);
  if (!threadId && from !== post.userAddress) {
    const notification = {
      groupId: '',
      status: group.loaded ?'unread' : 'read',
      type: 'comment',
      to: post.userAddress,
      toObjectId: post.id,
      toObjectType: 'post',
      from,
      fromObjectId: comment.id,
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
        threadId: threadComment.id
      }
    });
    await Comment.update(threadComment.id, threadComment);
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
          toObjectId: replyComment.id,
          toObjectType: 'comment',
          from,
          fromObjectId: comment.id,
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
          toObjectId: threadComment.id,
          toObjectType: 'comment',
          to: threadComment.userAddress,
          from,
          fromObjectId: comment.id,
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
    TrxId,
    Data: {
      object: {
        id,
        content,
        image,
        inreplyto,
      }
    },
    SenderPubkey,
    TimeStamp,
    GroupId,
  } = item;

  const comment = {
    content,
    objectId: '',
    threadId: '',
    replyId: '',
    userAddress: rumsdk.utils.pubkeyToAddress(SenderPubkey),
    groupId: GroupId,
    trxId: TrxId,
    id,
    storage: 'chain',
    commentCount: 0,
    hotCount: 0,
    likeCount: 0,
    timestamp: parseInt(String(TimeStamp / 1000000), 10)
  };
  if (image) {
    comment.images = image.map(v => ({ ...v, content: Buffer.from(v.content, 'base64').toString() }));
    comment.imageCount = image.length;
  }
  if (inreplyto) {
    const toId = inreplyto.id;
    const toPost = await Post.get(toId);
    const toComment = await Comment.get(toId);
    if (toPost) {
      comment.objectId = toPost.id;
    } else if (toComment) {
      comment.objectId = toComment.objectId;
      if (toComment.threadId) {
        comment.threadId = toComment.threadId;
        comment.replyId = toComment.id;
      } else {
        comment.threadId = toComment.id;
      }
    } else {
      return null;
    }
  }
  return comment;
}

const notify = async (id) => {
  const comment = await Comment.get(id, {
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
      url: `${config.origin}/posts/${comment.objectId}?commentId=${comment.id}`
    });
  }
}
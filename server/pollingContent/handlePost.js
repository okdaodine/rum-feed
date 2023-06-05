const rumSDK = require('rum-sdk-nodejs');
const Post = require('../database/post');
const { getSocketIo } = require('../socket');
const config = require('../config');
const Mixin = require('../mixin');
const truncateByBytes = require('../utils/truncateByBytes');
const within24Hours = require('../utils/within24Hours');
const extractUrls = require('../utils/extractUrls');
const isRetweetUrl = require('../utils/isRetweetUrl');
const Notification = require('../database/notification');
const Activity = require('../database/sequelize/activity');
const { trySendSocket } = require('../socket');

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
  await tryHandleRetweetNotification(post, group);
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
        attachment,
        object: retweetObject
      },
      published,
    },
    SenderPubkey,
    TimeStamp,
  } = item;
  const post = {
    content: (content || '').trim(),
    title: name || '',
    userAddress: rumSDK.utils.pubkeyToAddress(SenderPubkey),
    groupId: item.GroupId,
    trxId: TrxId,
    id,
    storage: 'chain',
    commentCount: 0,
    likeCount: 0,
    timestamp: published ? new Date(published).getTime() : parseInt(TimeStamp.slice(0, 13)),
  }
  if (image) {
    const images = Array.isArray(image) ? image : [image];
    post.images = images;
    post.imageCount = images.length;
  }
  if (retweetObject) {
    const retweet = await Post.get(retweetObject.id);
    if (retweet) {
      post.content += `${content.length > 0 ? ' ' : ''}${config.origin || 'https://rumsystem.net'}/posts/${retweetObject.id}`
    }
  }
  if (attachment) {
    const video = Array.isArray(attachment) ? attachment[0] : attachment;
    delete video.type;
    post.video = video;
  }
  return post
}

const tryHandleRetweetNotification = async (post, group) => {
  const urls = extractUrls(post.content);
  const retweetUrls = urls.filter(url => isRetweetUrl(url));
  for (const retweetUrl of retweetUrls) {
    const retweetId = retweetUrl ? new URL(retweetUrl).pathname.split('/')[2] : null;
    const retweet = await Post.get(retweetId);
    if (!retweet || retweet.userAddress === post.userAddress) {
      continue;
    }
    const notification = {
      groupId: '',
      status: within24Hours(post.timestamp) ?'unread' : 'read',
      type: 'retweet',
      to: retweet.userAddress,
      toObjectId: retweet.id,
      toObjectType: 'post',
      from: post.userAddress,
      fromObjectId: post.id,
      fromObjectType: 'post',
      timestamp: post.timestamp,
    };
    await Notification.create(notification);
    if (group.loaded) {
      trySendSocket(notification.to, 'notification', notification);
    }
  }
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
      const avatar = post.extra.userProfile.avatar;
      if (!config.mutedList?.includes(post.userAddress)) {
        Mixin.notifyByBot({
          iconUrl: avatar + (avatar.includes('?') ? `&` : '?') + 'rounded=true',
          title: (post.content || '').slice(0, 30) || '图片',
          description: `${truncateByBytes(name, 14)} 发布内容`,
          url: `${config.origin}/posts/${post.id}`
        });
      }
    }
    await Activity.create({
      groupId: post.groupId,
      userAddress: post.userAddress,
      type: 'post',
      content: (post.content || '').slice(0, 30) || 'Image',
      url: `/posts/${post.id}`,
      timestamp: Date.now(),
    });
  }
}

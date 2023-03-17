const Relation = require('../database/sequelize/relation');
const Notification = require('../database/notification');
const rumSDK = require('rum-sdk-nodejs');
const { trySendSocket } = require('../socket');

module.exports = async (item, group) => {
  const {
    Data: {
      type,
      object,
    },
    SenderPubkey,
  } = item;
  const from = rumSDK.utils.pubkeyToAddress(SenderPubkey);

  if (type === 'Follow') {
    await Relation.findOrCreate({
      where: {
        type: 'following',
        from,
        to: object.id,
      }
    });
    const notification = {
      groupId: '',
      status: group.loaded ? 'unread' : 'read',
      type: 'follow',
      toObjectId: '',
      toObjectType: '',
      to: object.id,
      from: from,
      fromObjectId: '',
      fromObjectType: '',
      timestamp: parseInt(String(item.TimeStamp / 1000000), 10)
    };
    await Notification.create(notification);
    if (group.loaded) {
      trySendSocket(notification.to, 'notification', notification);
    }
  }

  if (type === 'Undo' && item.Data.object.type === 'Follow') {
    const follow = item.Data.object;
    await Relation.destroy({
      where: {
        type: 'following',
        from,
        to: follow.object.id,
      }
    });
    await Notification.destroy({
      type: 'follow',
      to: follow.object.id,
      from: from,
    })
  }

  if (type === 'Block') {
    await Relation.findOrCreate({
      where: {
        type: 'muted',
        from,
        to: object.id,
      }
    });
  }

  if (type === 'Undo' && item.Data.object.type === 'Block') {
    const block = item.Data.object;
    await Relation.destroy({
      where: {
        type: 'muted',
        from,
        to: block.object.id,
      }
    });
  }
}

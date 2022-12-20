const Relation = require('../database/sequelize/relation');
const Group = require('../database/sequelize/group');
const Notification = require('../database/notification');
const QuorumLightNodeSDK = require('quorum-light-node-sdk-nodejs');
const { trySendSocket } = require('../socket');

module.exports = async (item) => {
  const relation = pack(item);
  const { type, groupId } = relation;
  delete relation.groupId;
  if (type === 'follow') {
    await Relation.findOrCreate({
      where: {
        ...relation,
        type: 'following'
      }
    });
    const group = await Group.findOne({
      where: {
        groupId
      }
    });
    if (group) {
      const notification = {
        groupId: '',
        status: group.loaded ? 'unread' : 'read',
        type: 'follow',
        toObjectId: '',
        toObjectType: '',
        to: relation.to,
        from: relation.from,
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
  if (type === 'unfollow') {
    await Relation.destroy({
      where: {
        ...relation,
        type: 'following'
      }
    });
    await Notification.destroy({
      type: 'follow',
      to: relation.to,
      from: relation.from,
    })
  }
  if (type === 'mute') {
    await Relation.findOrCreate({
      where: {
        ...relation,
        type: 'muted'
      }
    });
  }
  if (type === 'unmute') {
    await Relation.destroy({
      where: {
        ...relation,
        type: 'muted'
      }
    });
  }
}

const pack = (item) => {
  const { groupId, to, type } = JSON.parse(item.Data.content);
  const data = {
    groupId,
    type,
    to,
    from: QuorumLightNodeSDK.utils.pubkeyToAddress(item.SenderPubkey)
  };
  return data;
}
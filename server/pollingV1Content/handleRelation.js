const Relation = require('../database/sequelize/relation');
const Group = require('../database/sequelize/group');
const Notification = require('../database/notification');
const rumSDK = require('rum-sdk-nodejs');
const { trySendSocket } = require('../socket');
const V1Content = require('../database/v1Content');

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
    await V1Content.create({
      data: {
        type: 'Follow',
        object: {
          type: 'Person',
          id: relation.to,
        },
      },
      trxId: item.TrxId,
      groupId: item.GroupId,
      raw: item,
      userAddress: relation.from,
      status: 'pending'
    });
    const group = await Group.findOne({
      where: {
        groupId
      }
    });
    if (group) {
      const notification = {
        groupId: '',
        status: 'read',
        type: 'follow',
        toObjectId: '',
        toObjectType: '',
        to: relation.to,
        from: relation.from,
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
    });
    await V1Content.create({
      data: {
        type: 'Undo',
        object: {
          type: 'Follow',
          object: {
            type: 'Person',
            id: relation.to,
          },
        }
      },
      trxId: item.TrxId,
      groupId: item.GroupId,
      raw: item,
      userAddress: relation.from,
      status: 'pending'
    });
  }
  if (type === 'mute') {
    await Relation.findOrCreate({
      where: {
        ...relation,
        type: 'muted'
      }
    });
    await V1Content.create({
      data: {
        type: 'Block',
        object: {
          type: 'Person',
          id: relation.to,
        },
      },
      trxId: item.TrxId,
      groupId: item.GroupId,
      raw: item,
      userAddress: relation.from,
      status: 'pending'
    });
  }
  if (type === 'unmute') {
    await Relation.destroy({
      where: {
        ...relation,
        type: 'muted'
      }
    });
    await V1Content.create({
      data: {
        type: 'Undo',
        object: {
          type: 'Block',
          object: {
            type: 'Person',
            id: relation.to,
          },
        }
      },
      trxId: item.TrxId,
      groupId: item.GroupId,
      raw: item,
      userAddress: relation.from,
      status: 'pending'
    });
  }
}

const pack = (item) => {
  const { groupId, to, type } = JSON.parse(item.Data.content);
  const data = {
    groupId,
    type,
    to,
    from: rumSDK.utils.pubkeyToAddress(item.SenderPubkey)
  };
  return data;
}
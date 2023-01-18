const Relation = require('../database/sequelize/relation');
const Group = require('../database/sequelize/group');
const Notification = require('../database/notification');
const rumsdk = require('rum-sdk-nodejs');
const { trySendSocket } = require('../socket');

module.exports = async (item) => {
  const {
    Data: {
      type,
      object: {
        id: to,
      },
      target: {
        id: groupId,
      },
    },
    SenderPubkey,
  } = item;
  const from = rumsdk.utils.pubkeyToAddress(SenderPubkey)

  if (type === 'Follow') {
    await Relation.findOrCreate({
      where: {
        type: 'following',
        from,
        to,
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
        to: to,
        from: from,
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

  if (type === 'Ignore') {
    await Relation.destroy({
      where: {
        type: 'following',
        from,
        to,
      }
    });
    await Notification.destroy({
      type: 'follow',
      to: to,
      from: from,
    })
  }

  if (type === 'Block') {
    await Relation.findOrCreate({
      where: {
        type: 'muted',
        from,
        to,
      }
    });
  }

  if (type === 'Unblock') {
    await Relation.destroy({
      where: {
        type: 'muted',
        from,
        to,
      }
    });
  }
}

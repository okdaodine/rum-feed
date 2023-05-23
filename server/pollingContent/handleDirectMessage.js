const Message = require('../database/sequelize/message');
const { trySendSocket } = require('../socket');
const rumSDK = require('rum-sdk-nodejs');

module.exports = async (item, group) => {
  const {
    Data: {
      object,
    },
    SenderPubkey,
  } = item;
  if (!object.content) {
    return;
  }
  const message = JSON.parse(object.content);
  const exists = await Message.findOne({ where: { uuid: message.uuid } })
  if (exists) {
    return;
  }
  const userAddress = rumSDK.utils.pubkeyToAddress(SenderPubkey);
  if (userAddress !== message.fromAddress) {
    return;
  }
  await Message.create({
    ...message,
    status: group.loaded ? 'unread' : 'read'
  });
  trySendSocket(message.toAddress, 'message', message);
}

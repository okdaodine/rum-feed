const moment = require('moment');

const map = {};

exports.save = (groupId, trxId) => {
  map[`${groupId} | ${trxId}`] = Date.now();
}

exports.isTimeOut = groupId => {
  for (const [key, trxCreatedAt] of Object.entries(map)) {
    if (key.split(' | ')[0] === groupId) {
      const seconds = Math.abs(moment(trxCreatedAt).diff(new Date(), 'seconds'));
      return seconds > 10;
    }
  }
  return false;
}

exports.tryRemove = (groupId, trxId) => {
  if (map[`${groupId} | ${trxId}`]) {
    delete map[`${groupId} | ${trxId}`];
  }
}
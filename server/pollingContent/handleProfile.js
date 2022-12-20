const Profile = require('../database/profile');
const QuorumLightNodeSDK = require('quorum-light-node-sdk-nodejs');

module.exports = async (item) => {
  await Profile.upsert(pack(item));
}

const pack = (item) => {
  const { name, image } = item.Data;
  const data = {
    userAddress: QuorumLightNodeSDK.utils.pubkeyToAddress(item.SenderPubkey),
    groupId: '',
    updatedAt: Date.now()
  };
  if (name) {
    data.name = name;
  }
  if (image) {
    data.avatar = `data:${image.mediaType};base64,${image.content}`;
  }
  return data;
}
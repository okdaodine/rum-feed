const Profile = require('../database/profile');
const rumSDK = require('rum-sdk-nodejs');
const V1Content = require('../database/v1Content');

module.exports = async (item) => {
  const profile = pack(item);
  await Profile.upsert(profile);
  await V1Content.create({
    data: {
      type: 'Create',
      object: {
        type: 'Profile',
        name: item.Data.name || '',
        ...(
          item.Data.image ? 
          { image: [{ type: 'Image', mediaType: item.Data.image.mediaType, content: item.Data.image.content,}] } :
          {}
        ),
        describes: {
          type: 'Person',
          id: profile.userAddress,
        },
      },
    },
    trxId: item.TrxId,
    groupId: item.GroupId,
    raw: item,
    userAddress: profile.userAddress,
    status: 'pending'
  });
}

const pack = (item) => {
  const { name, image } = item.Data;
  const data = {
    userAddress: rumSDK.utils.pubkeyToAddress(item.SenderPubkey),
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
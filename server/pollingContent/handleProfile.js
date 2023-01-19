const Profile = require('../database/profile');
const rumsdk = require('rum-sdk-nodejs');

module.exports = async (item) => {
  await Profile.upsert(pack(item));
}

const pack = (item) => {
  const {
    Data: {
      object: {
        name,
        image,
      }
    },
    SenderPubkey,
  } = item;
  const data = {
    userAddress: rumsdk.utils.pubkeyToAddress(SenderPubkey),
    groupId: '',
    updatedAt: Date.now()
  };
  if (name) {
    data.name = name;
  }
  if (image && image.length) {
    const img = image[0];
    const mediaType = img.mediaType
    const content = img.content
    const url = `data:${mediaType};base64,${content}`
    data.avatar = url;
  }
  return data;
}
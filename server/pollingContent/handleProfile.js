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
    const img = Buffer.from(image[0].content, 'base64');
    const url = img.toString();
    data.avatar = url;
  }
  return data;
}
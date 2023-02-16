const Wallet = require('../database/sequelize/wallet');
const rumSDK = require('rum-sdk-nodejs');
const { assert, Errors } = require('../utils/validator');
const { ethers } = require("ethers");

const { Op } = require("sequelize");
module.exports = async item => {
  const {
    Data: {
      object
    },
    SenderPubkey,
  } = item;

  const { message, signature } = JSON.parse(object.summary);
  const senderAddress = rumSDK.utils.pubkeyToAddress(SenderPubkey);
  const [, addressInMessage] = message.split(' | ');

  assert(addressInMessage === senderAddress, Errors.ERR_IS_INVALID('address'));

  const { typeTransform } = rumSDK.utils;
  const bytes = ethers.utils.toUtf8Bytes(message);
  const hash = ethers.utils.keccak256(bytes).toString();
  const digest = typeTransform.hexToUint8Array(hash);
  const providerAddress = ethers.utils.recoverAddress(digest, signature).toLowerCase();

  const count = await Wallet.count({ where: { 
    [Op.or]: [{
      address: senderAddress
    }, {
      providerAddress
    }]
 }});

 if (count === 0) {
    await Wallet.create({
      address: senderAddress,
      providerAddress,
      encryptedPrivateKey: object.content
    });
  }
}

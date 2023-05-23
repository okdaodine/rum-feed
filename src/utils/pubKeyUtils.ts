import { utils as etherUtils } from 'ethers';
import { utils as RumSdkUtils } from 'rum-sdk-browser';
import * as Base64 from 'js-base64';

const getAddress = (pubKey: string) => {
  const u8s = Base64.toUint8Array(pubKey);
  return etherUtils.computeAddress(`0x${RumSdkUtils.typeTransform.uint8ArrayToHex(u8s)}`);
}

const decompress = (pubKey: string) => {
  const u8s = Base64.toUint8Array(pubKey);
  return etherUtils.computePublicKey(`0x${RumSdkUtils.typeTransform.uint8ArrayToHex(u8s)}`).replace('0x', '');
}

const getPubKeyFromPrivateKey = (privateKey: string) => {
  const signingKey = new etherUtils.SigningKey(privateKey);
  const pubKeyBuffer = RumSdkUtils.typeTransform.hexToUint8Array(signingKey.compressedPublicKey.replace('0x', ''));
  return Base64.fromUint8Array(pubKeyBuffer, true);
}

export default {
  getAddress,
  decompress,
  getPubKeyFromPrivateKey
}
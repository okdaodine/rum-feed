import * as eciesjs from 'eciesjs';
import { ethers } from 'ethers';
import { utils as RumSdkUtils } from 'rum-sdk-browser';
import { VaultApi } from 'apis';
import store from 'store2';

const cryptoStore = store.namespace('crypto');

const encrypt = async (p: {
  message: string,
  publicKey: string,
  privateKey?: string
  vaultJWT?: string
}) => {
  let signature = '';
  const { message, publicKey, privateKey, vaultJWT } = p;
  const hash = ethers.utils.id(message).replace('0x', '');
  if (privateKey) {
    const signingKey = new ethers.utils.SigningKey(privateKey);
    const digest = RumSdkUtils.typeTransform.hexToUint8Array(hash);
    const signatureObj = signingKey.signDigest(digest);
    signature = ethers.utils.joinSignature(signatureObj).replace('0x', '');
  }
  if (vaultJWT) {
    signature = await getVaultTrxCreateParam({
      hash,
      jwt: vaultJWT,
    });
  }
  const payload = {
    message,
    signature
  };
  const encrypted = await eciesjs.encrypt(
    publicKey,
    new TextEncoder().encode(JSON.stringify(payload)) as Buffer,
  );
  return RumSdkUtils.typeTransform.uint8ArrayToHex(encrypted);
}

const decrypt = async (p: {
  encryptedHex: string,
  privateKey?: string
  vaultJWT?: string
}) => {
  const { encryptedHex, privateKey, vaultJWT } = p;
  const cacheKey = `${ethers.utils.id(encryptedHex)}`;
  if (cryptoStore(cacheKey)) {
    return cryptoStore(cacheKey);
  }
  let decryptedString = '';
  if (privateKey) {
    const decrypted = await eciesjs.decrypt(
      privateKey,
      RumSdkUtils.typeTransform.hexToUint8Array(encryptedHex) as Buffer,
    );
    decryptedString = RumSdkUtils.typeTransform.uint8ArrayToString(decrypted);
  }
  if (vaultJWT) {
    const res = await VaultApi.decrypt({
      encryptedMessages: [encryptedHex],
      jwt: vaultJWT,
    });
    const decryptedHex = res!.decrypted[0].replace(/^0x/, '');
    const decryptedU8s = RumSdkUtils.typeTransform.hexToUint8Array(decryptedHex);
    decryptedString = RumSdkUtils.typeTransform.uint8ArrayToString(decryptedU8s);
  }
  const decryptedPayload = JSON.parse(decryptedString);
  const digest = RumSdkUtils.typeTransform.hexToUint8Array(ethers.utils.id(decryptedPayload.message));
  const senderPublicKey = ethers.utils.recoverPublicKey(
      digest,
      `0x${decryptedPayload.signature}`,
  );
  const senderAddress = ethers.utils.computeAddress(senderPublicKey);
  const result = {
    senderAddress,
    message: decryptedPayload.message
  };
  cryptoStore(cacheKey, result)
  return result;
}

const bulkDecrypt = async (p: {
  encryptedHexes: string[],
  privateKey?: string
  vaultJWT?: string
}) => {
  const { encryptedHexes, privateKey, vaultJWT } = p;
  if (privateKey) {
    return Promise.all(encryptedHexes.map((encryptedHex) => decrypt({
      encryptedHex,
      privateKey
    })));
  }
  const res = await VaultApi.decrypt({
    encryptedMessages: encryptedHexes,
    jwt: vaultJWT || '',
  });
  return (res.decrypted || []).map(decrypted => {
    const decryptedHex = decrypted.replace(/^0x/, '');
    const decryptedU8s = RumSdkUtils.typeTransform.hexToUint8Array(decryptedHex);
    const decryptedString = RumSdkUtils.typeTransform.uint8ArrayToString(decryptedU8s);
    const decryptedPayload = JSON.parse(decryptedString);
    const digest = RumSdkUtils.typeTransform.hexToUint8Array(ethers.utils.id(decryptedPayload.message));
    const senderPublicKey = ethers.utils.recoverPublicKey(
        digest,
        `0x${decryptedPayload.signature}`,
    );
    const senderAddress = ethers.utils.computeAddress(senderPublicKey);
    return {
      senderAddress,
      message: decryptedPayload.message
    }
  });
}

const getVaultTrxCreateParam = async (vaultOptions: {
  hash: string
  jwt: string 
}) => {
  const { hash, jwt } = vaultOptions;
  const res = await VaultApi.sign(hash, jwt);
  return res.signature.replace(/^0x/, '');
}

export default {
  encrypt,
  decrypt,
  bulkDecrypt
}
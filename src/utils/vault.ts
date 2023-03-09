import { VaultApi } from 'apis';
import { utils } from 'ethers';
import { Base64, toUint8Array } from 'js-base64';
import qs from 'query-string';

export const getTrxCreateParam = (ethPubKey: string, jwt: string) => {
  const compressedPublicKey = utils.arrayify(utils.computePublicKey(ethPubKey, true));
  const publicKey = Base64.fromUint8Array(compressedPublicKey, true);
  return {
    publicKey,
    sign: async (m: string) => {
      const res = await VaultApi.sign(`0x${m}`, jwt);
      if (!res) { throw new Error(); }
      return res.signature.replace(/^0x/, '');
    },
  };
}

export const createKey = async () => {
  const aesKey = await window.crypto.subtle.generateKey({
    name: 'AES-GCM',
    length: 256,
  }, true, ['encrypt', 'decrypt']);
  const keyBuffer = await window.crypto.subtle.exportKey('raw', aesKey);
  const keyInHex = Array.from(new Uint8Array(keyBuffer)).map((v) => `0${v.toString(16)}`.slice(-2)).join('');
  return {
    aesKey,
    keyInHex
  }
}

export const saveCryptoKeyToLocalStorage = async (aesKey: CryptoKey) => {
  const jwk = await window.crypto.subtle.exportKey("jwk", aesKey);
  localStorage.setItem('jwk', JSON.stringify(jwk));
}

export const getCryptoKeyFromLocalStorage = async () => {
  const jwk: any = JSON.parse(localStorage.getItem('jwk') || '');
  const result = await window.crypto.subtle.importKey(
    "jwk", {
        kty: jwk.kty,
        k: jwk.k,
        alg: jwk.alg,
        ext: jwk.ext,
    }, {   
      name: "AES-GCM",
    }, true, jwk.key_ops 
  )
  return result;
}

export const removeCryptoKeyFromLocalStorage = async () => {
  localStorage.removeItem('jwk');
}

export const decryptByCryptoKey = async (token: string) => {
  const cipher = new Uint8Array(toUint8Array(token));
  const iv = cipher.slice(0, 12);
  const data = cipher.slice(12);
  const cryptoKey = await getCryptoKeyFromLocalStorage();
  const plain = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data,
  );
  return new TextDecoder().decode(plain);
}

export const getMixinOauthUrl = (p: {
  state: string,
  return_to: string
  scope?: string
}) => {
  return `https://vault.rumsystem.net/v1/oauth/mixin/login?${qs.stringify(p)}`
}

export const getGithubOauthUrl = (p: {
  state: string,
  return_to: string
}) => {
  return `https://vault.rumsystem.net/v1/oauth/github/login?${qs.stringify(p)}`
}

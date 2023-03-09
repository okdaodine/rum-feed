import request from 'request';
import { VAULT_API_BASE_URL, VAULT_APP_ID } from './common';
import { IVaultUser, IVaultAppUser } from './types';
import qs from 'query-string';

export default {
  async getUser(jwt: string) {
    const res = await request(`/user`, {
      base: VAULT_API_BASE_URL,
      jwt
    });
    return res as IVaultUser;
  },

  async getAppUser(jwt: string, userId: number) {
    const res = await request(`/app/user?${qs.stringify({
      appid: VAULT_APP_ID,
      userid: userId
    })}`, {
      base: VAULT_API_BASE_URL,
      jwt
    });
    return res as IVaultAppUser;
  },

  async createAppUser(jwt: string) {
    const res = await request(`/app/user`, {
      base: VAULT_API_BASE_URL,
      method: 'POST',
      jwt,
      body: { appid: VAULT_APP_ID },
    });
    return res as IVaultAppUser;
  },

  async sign(hash: string, jwt: string) {
    const res = await request(`/app/user/sign`, {
      base: VAULT_API_BASE_URL,
      method: 'POST',
      jwt,
      body: { appid: VAULT_APP_ID, hash },
    });
    return res as {
      address: string
      signature: string
    };
  },

  async createUserBySignature(p: {
    address: string
    data: string
    signature: string
  }) {
    console.log(`[createUserBySignature]:`, { p });
    const res = await request(`/user/eth/address`, {
      base: VAULT_API_BASE_URL,
      method: 'POST',
      body: p,
    });
    return res as IVaultAppUser;
  },
}
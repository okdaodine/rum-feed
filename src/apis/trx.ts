import request from 'request';
import { API_BASE_URL } from './common';
import { IActivity, ITrx, utils } from 'rum-sdk-browser';
import { Store } from 'store';

export default {
  async createActivity(activity: IActivity, groupId: string, privateKey?: string, options?: {
    trxId?: string;
    timestamp?: number;
  }) {
    const { groupStore, userStore } = (window as any).store as Store;
    const group = groupStore.map[groupId];

    activity.published = new Date().toISOString();

    console.log(activity, { group: group.groupName });

    const payload = await utils.signTrx({
      data: activity,
      groupId: group.groupId,
      aesKey: group.extra.rawGroup.cipherKey,
      privateKey: privateKey || userStore.privateKey,
      ...(userStore.jwt ? getVaultTrxCreateParam({
        ethPubKey: userStore.vaultAppUser.eth_pub_key, jwt: userStore.jwt
      }) : {}),
      ...(options || {})
    });
    console.log(payload);
    const res: { trx_id: string } = await request(`${API_BASE_URL}/${groupId}/trx`, {
      method: 'POST',
      body: payload
    });
    return res;
  },

  async get(groupId: string, trxId: string) {
    const res: ITrx = await request(`${API_BASE_URL}/${groupId}/trx/${trxId}`);
    return res;
  }
}

interface IVaultOptions {
  ethPubKey: string
  jwt: string 
}

const getVaultTrxCreateParam = (vaultOptions: IVaultOptions) => {
  const { ethPubKey, jwt } = vaultOptions;
  const VAULT_API_BASE_URL = 'https://vault.rumsystem.net/v1';
  const VAULT_APP_ID = 1065804423237;
  return {
    publicKey: ethPubKey,
    sign: async (m: string) => {
      const res = await request(`/app/user/sign`, {
        base: VAULT_API_BASE_URL,
        method: 'POST',
        body: {
          appid: VAULT_APP_ID,
          hash: `0x${m}`
        },
        headers: {
          Authorization: `Bearer ${jwt}`,
        } 
      });
      return res.signature.replace(/^0x/, '');
    },
  };
}
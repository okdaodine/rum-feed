import request from 'request';
import { API_BASE_URL } from './common';
import { IObject, IPerson, ITrx, utils } from 'quorum-light-node-sdk';
import { Store } from 'store';

interface IVaultOptions {
  ethPubKey: string
  jwt: string 
}

export default {
  createObject(p: { groupId: string, object: IObject }) {
    return createTrx(p.groupId, p.object, '_Object');
  },

  createPerson(p: { groupId: string, person: IPerson }) {
    return createTrx(p.groupId, p.person, 'Person');
  },

  async get(groupId: string, trxId: string) {
    const res: ITrx = await request(`${API_BASE_URL}/${groupId}/trx/${trxId}`);
    return res;
  }
}

async function createTrx(groupId: string, data: IObject | IPerson, type: '_Object' | 'Person') {
  const { configStore, groupStore, userStore } = (window as any).store as Store;
  const payload = await utils.signTrx({
    type,
    data,
    groupId,
    aesKey: groupStore.map[groupId].extra.rawGroup.cipherKey,
    version: configStore.config.version,
    privateKey: userStore.privateKey,
    ...(userStore.jwt ? getVaultTrxCreateParam({
      ethPubKey: userStore.vaultAppUser.eth_pub_key, jwt: userStore.jwt
    }) : {})
  });
  console.log(payload);
  const res: { trx_id: string } = await request(`${API_BASE_URL}/${groupId}/trx`, {
    method: 'POST',
    body: payload
  });
  return res;
};

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
import request from 'request';
import { API_BASE_URL } from './common';

export default {
  async get(groupId: string, pubKey: string) {
    await request(`${API_BASE_URL}/${groupId}/permission/${pubKey}`);
  },

  async tryAdd(groupId: string, pubKey: string, provider: string, accessToken: string) {
    const res = await request(`${API_BASE_URL}/${groupId}/permission/${pubKey}?provider=${provider}&access_token=${accessToken}`, {
      method: 'POST'
    });
    return res as {
      nft: {
        collection_id: string
        meta: {
          description: string
          hash: string
          icon_url: string
          name: string
        }
      },
      allow?: {
        GroupOwnerPubkey: string
        GroupOwnerSign: string
        Memo: string
        Pubkey: string
        TimeStamp: number
      }
    };
  },
}
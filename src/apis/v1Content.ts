import request from 'request';
import { API_BASE_URL } from './common';
import { IV1Content } from './types';

export default {
  async listTrxIds(userAddress: string) {
    const items: string[] = await request(`${API_BASE_URL}/v1/contents?userAddress=${userAddress}&raw=true&status=pending&trxIdOnly=true&limit=9999`);
    return items;
  },

  async done(trxId: string) {
    const res: boolean = await request(`${API_BASE_URL}/v1/contents/${trxId}`, {
      method: 'POST'
    });
    return res;
  },

  async get(trxId: string) {
    const res: IV1Content = await request(`${API_BASE_URL}/v1/contents/${trxId}`);
    return res;
  },
}
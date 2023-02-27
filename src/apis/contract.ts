import request from 'request';
import { API_BASE_URL } from './common';

export default {
  async check(mainnet: string, contractAddress: string) {
    const res: { groupName: string } = await request(`${API_BASE_URL}/contracts/${mainnet}/${contractAddress}`, {
      method: 'post'
    });
    return res;
  },
}
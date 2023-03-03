import request from 'request';
import { API_BASE_URL } from './common';

export default {
  async checkGroup(p: { mainnet: string, contractAddress: string }) {
    const res: { groupName: string } = await request(`${API_BASE_URL}/contracts/${p.mainnet}/${p.contractAddress}`, {
      method: 'post'
    });
    return res;
  },
  async checkUserAddress(p: { mainnet: string, contractAddress: string, userAddress: string }) {
    const res: any = await request(`${API_BASE_URL}/contracts/${p.mainnet}/${p.contractAddress}/${p.userAddress}`, {
      method: 'post'
    });
    return res;
  },
}
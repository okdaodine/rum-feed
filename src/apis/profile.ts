import request from 'request';
import { API_BASE_URL } from './common';
import { IProfile } from './types';

export default {
  async get(userAddress: string) {
    const item: IProfile = await request(`${API_BASE_URL}/profiles/${userAddress}`);
    return item;
  },

  async exist(userAddress: string) {
    const item: boolean = await request(`${API_BASE_URL}/profiles/${userAddress}/exist`);
    return item;
  }
}
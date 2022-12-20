import request from 'request';
import { API_BASE_URL } from './common';
import { IFeature } from './types';

export default {
  async list(userAddress: string) {
    const res = await request(`${API_BASE_URL}/features/${userAddress}`);
    return res as IFeature[];
  },
}
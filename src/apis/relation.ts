import request from 'request';
import { API_BASE_URL } from './common';
import { IRelation } from './types';
import qs from 'query-string';

export default {
  async listFollowing(userAddress: string, options: {
    limit: number,
    offset: number
  }) {
    const item = await request(`${API_BASE_URL}/relations/${userAddress}/following?${qs.stringify(options || {})}`);
    return item as IRelation[];
  },


  async listFollowers(userAddress: string, options: {
    limit: number,
    offset: number
  }) {
    const item = await request(`${API_BASE_URL}/relations/${userAddress}/followers?${qs.stringify(options || {})}`);
    return item as IRelation[];
  },

  async listMuted(userAddress: string, options: {
    limit: number,
    offset: number
  }) {
    const item = await request(`${API_BASE_URL}/relations/${userAddress}/muted?${qs.stringify(options || {})}`);
    return item as IRelation[];
  }
}
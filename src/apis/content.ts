import request from 'request';
import { API_BASE_URL } from './common';
import { IContent } from './types';
import qs from 'query-string';

export default {
  async list(groupId: string, options: {
    offset: number
    limit: number
    minimal: boolean
  }) {
    const items: IContent[] = await request(`${API_BASE_URL}/contents/${groupId}?${qs.stringify(options)}`);
    return items;
  },

  async get(groupId: string, trxId: string) {
    const item: IContent = await request(`${API_BASE_URL}/contents/${groupId}/${trxId}`);
    return item;
  },
}
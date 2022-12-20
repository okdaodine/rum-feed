import request from 'request';
import { API_BASE_URL } from './common';
import { IComment } from './types';
import qs from 'query-string';

export default {
  async list(options: {
    objectId: string;
    viewer?: string
    offset?: number
    limit?: number
  }) {
    const items: IComment[] = await request(`${API_BASE_URL}/comments?${qs.stringify(options)}`);
    return items;
  }
}
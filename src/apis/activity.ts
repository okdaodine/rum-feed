import request from 'request';
import { API_BASE_URL } from './common';
import { IActivity } from './types';
import qs from 'query-string';

export default {
  async list(p: {
    limit: number
    offset: number
    viewer?: string
  }) {
    const items: IActivity[] = await request(`${API_BASE_URL}/activities?${qs.stringify(p, { skipEmptyString: true })}`);
    return items;
  },
}
import request from 'request';
import { API_BASE_URL } from './common';
import { ILink } from './types/link';

export default {
  async get(url: string) {
    const item: ILink = await request(`${API_BASE_URL}/links/${encodeURIComponent(url)}`);
    return item;
  },
}
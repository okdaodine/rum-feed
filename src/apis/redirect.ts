import request from 'request';
import { API_BASE_URL } from './common';

export default {
  async get(url: string) {
    const item: { redirectUrl: string } = await request(`${API_BASE_URL}/redirect/${encodeURIComponent(url)}`);
    return item;
  },
}
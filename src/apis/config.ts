import request from 'request';
import { API_BASE_URL } from './common';
import { IConfig } from './types';

export default {
  async get() {
    const item: IConfig = await request(`${API_BASE_URL}/config`);
    return item;
  },
}
import request from 'request';
import { API_BASE_URL } from './common';
import { IGroup } from './types';

export default {
  async create(seedUrl: string) {
    const item: IGroup = await request(`${API_BASE_URL}/seeds`, {
      method: 'POST',
      body: {
        url: seedUrl
      }
    });
    return item;
  }
}
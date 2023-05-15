import request from 'request';
import { API_BASE_URL } from './common';
import { IFavorite } from './types';
import qs from 'query-string';

export default {
  async list(p: {
    limit: number
    offset: number
    viewer?: string
  }) {
    const items: IFavorite[] = await request(`${API_BASE_URL}/favorites?${qs.stringify(p, { skipEmptyString: true })}`);
    return items;
  },

  async get(objectId: string, p: { viewer?: string }) {
    const item: IFavorite = await request(`${API_BASE_URL}/favorites/${objectId}?${qs.stringify(p, { skipEmptyString: true })}`);
    return item;
  },
}
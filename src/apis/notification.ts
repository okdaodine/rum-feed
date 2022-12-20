import request from 'request';
import { API_BASE_URL } from './common';
import { INotification, NotificationType } from './types';
import qs from 'query-string';

export default {
  async list(userAddress: string, type: NotificationType, options?: {
    limit: number,
    offset: number
  }) {
    const items: INotification[] = await request(`${API_BASE_URL}/notifications/${userAddress}/${type}?${qs.stringify(options || {})}`);
    return items;
  },

  async getUnreadCount(userAddress: string, type: NotificationType) {
    const count: number = await request(`${API_BASE_URL}/notifications/${userAddress}/${type}/unread_count`);
    return count;
  }
}
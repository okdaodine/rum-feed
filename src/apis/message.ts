import request from 'request';
import { API_BASE_URL } from './common';
import { IConversation, IMessage } from './types';
import qs from 'query-string';

export default {
  async listConversations(userAddress: string) {
    const items: IConversation[] = await request(`${API_BASE_URL}/messages/${userAddress}/conversations`);
    return items;
  },

  async listMessages(conversationId: string, p: {
    limit: number
    offset: number
    viewer: string
  }) {
    const items: IMessage[] = await request(`${API_BASE_URL}/messages/conversations/${conversationId}?${qs.stringify(p, { skipEmptyString: true })}`);
    return items;
  },

  async createMessage(payload: {
    fromAddress: string
    fromPubKey: string
    fromContent: string
    toAddress: string
    toPubKey: string
    toContent: string
    timestamp: string
    status: string
  }) {
    const item: IMessage = await request(`${API_BASE_URL}/messages`, {
      method: 'POST',
      body: payload
    });
    return item;
  },

  async getUnreadCount(userAddress: string) {
    const item: number = await request(`${API_BASE_URL}/messages/${userAddress}/unread_count`);
    return item;
  },

  async markAsRead(conversationId: string, userAddress: string) {
    const item: boolean = await request(`${API_BASE_URL}/messages/conversations/${conversationId}/${userAddress}/read`, {
      method: 'POST',
    });
    return item;
  },
}
import request from 'request';
import { TWEET_API_ORIGIN } from './common';

export default {
  async get(groupId: string, userAddress: string) {
    const res = await request(`${TWEET_API_ORIGIN}/api/${groupId}/users/${userAddress}`);
    return res as { url: string };
  },

  async create(groupId: string, payload: {
    url: string
    pubKey: string
    remoteSignToken: string
  }) {
    await request(`${TWEET_API_ORIGIN}/api/${groupId}/users`, {
      method: 'POST',
      body: payload
    });
  },

  async update(groupId: string, userAddress: string, payload: { url: string }) {
    await request(`${TWEET_API_ORIGIN}/api/${groupId}/users/${userAddress}`, {
      method: 'PUT',
      body: payload
    });
  },

  async remove(groupId: string, userAddress: string) {
    await request(`${TWEET_API_ORIGIN}/api/${groupId}/users/${userAddress}`, {
      method: 'DELETE',
    });
  },
}

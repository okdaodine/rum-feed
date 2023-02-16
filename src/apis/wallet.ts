import request from 'request';
import { API_BASE_URL } from './common';
import { IWallet } from './types';

export default {
  async get(providerAddress: string) {
    const item: IWallet = await request(`${API_BASE_URL}/wallets/${providerAddress}`);
    return item;
  }
}
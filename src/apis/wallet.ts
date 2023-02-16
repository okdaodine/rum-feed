import request from 'request';
import { API_BASE_URL } from './common';
import { IWallet } from './types';

export default {
  async get(address: string) {
    const item: IWallet = await request(`${API_BASE_URL}/wallets/${address}`);
    return item;
  },
  async getByProviderAddress(providerAddress: string) {
    const item: IWallet = await request(`${API_BASE_URL}/wallets/provider/${providerAddress}`);
    return item;
  }
}
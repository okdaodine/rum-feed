import { isProduction } from 'utils/env';

export enum TrxStorage {
  cache = 'cache',
  chain = 'chain'
}

export const API_ORIGIN = isProduction ?  window.location.origin : 'http://localhost:9000';

export const API_BASE_URL = `${API_ORIGIN}/api`;
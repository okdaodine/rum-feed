import { isProduction } from 'utils/env';

export enum TrxStorage {
  cache = 'cache',
  chain = 'chain'
}

export const API_ORIGIN = isProduction ?  window.location.origin : 'http://localhost:9000';

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const OBJECT_STATUS_DELETED_LABEL = 'OBJECT_STATUS_DELETED';

export const VAULT_API_BASE_URL = 'https://vault.rumsystem.net/v1';

export const VAULT_APP_ID = 1065804423237;
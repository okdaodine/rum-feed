import { IConfig } from 'apis/types';

export function createConfigStore() {
  return {
    config: {} as IConfig,

    set(config: IConfig) {
      this.config = config;
    }
  };
}

import { IProfile, IUser } from 'apis/types';
import store from 'store2';

export function createUserStore() {
  return {
    _address: store('address') || '',

    privateKey: store('privateKey') || '',
 
    jwt: store('jwt') || '',
    
    userMap: {} as Record<string, IUser | undefined>,

    profile: {} as IProfile,

    get address() {
      return this._address;
    },

    get isLogin() {
      return !!(this.jwt || this.address)
    },

    get user() {
      return this.userMap[this.address] || {} as IUser;
    },

    saveAddress(address: string) {
      store('address', address);
    },

    savePrivateKey(privateKey: string) {
      store('privateKey', privateKey);
    },

    setProfile(profile: IProfile) {
      this.profile = profile;
    },

    setUser(address: string, user: IUser) {
      this.userMap[address] = user;
    },

    updateUser(address: string, user: Partial<IUser>) {
      for (const [key, value] of Object.entries(user)) {
        const _user = this.userMap[address] as any;
        _user[key] = value;
      }
    },

    clear() {
      store.remove('address');
      store.remove('privateKey');
    }
  };
}

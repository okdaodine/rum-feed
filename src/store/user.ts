import { IProfile, IUser, IVaultAppUser, IStorageUser } from 'apis/types';
import store from 'store2';
import pubKeyUtils from 'utils/pubKeyUtils';
import { ethers } from 'ethers';

export function createUserStore() {
  return {
    _address: store('address') || '',

    privateKey: store('privateKey') || '',
 
    jwt: store('jwt') || '',

    storageUsers: (store('storageUsers') || []) as IStorageUser[],

    vaultAppUser: (store('vaultAppUser') || {}) as IVaultAppUser,
    
    userMap: {} as Record<string, IUser | undefined>,

    profile: {} as IProfile,

    get address() {
      return this._address || this.vaultAppUser.eth_address;
    },

    get isLogin() {
      return !!(this.jwt || this.address)
    },

    get user() {
      return this.userMap[this.address] || {} as IUser;
    },

    get pubKey() {
      if (this.jwt) {
        return this.vaultAppUser.eth_pub_key;
      }
      if (this.privateKey) {
        return pubKeyUtils.getPubKeyFromPrivateKey(this.privateKey);
      }
      return '';
    },

    savePrivateKey(privateKey: string) {
      const address = ethers.utils.computeAddress(privateKey);
      store('address', address);
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

    setVaultAppUser(jwt: string, vaultAppUser: IVaultAppUser) {
      this.jwt = jwt;
      this.vaultAppUser = vaultAppUser;
      this.saveVaultAppUser(jwt, vaultAppUser);
    },

    saveVaultAppUser(jwt: string, vaultAppUser: IVaultAppUser) {
      store('jwt', jwt);
      store('vaultAppUser', vaultAppUser);
    },

    addStorageUser(storageUser: IStorageUser) {
      if (this.storageUsers.length === 0) {
        this.storageUsers.push({
          address: this.address,
          privateKey: this.privateKey,
          jwt: this.jwt,
          vaultAppUser: this.vaultAppUser,
        });
      }
      for (const _storageUser of this.storageUsers) {
        if (this.getStorageUserAddress(_storageUser) === this.getStorageUserAddress(storageUser)) {
          return;
        }
      }
      this.storageUsers.push(storageUser);
      store('storageUsers', this.storageUsers);
    },

    removeStorageUser(address: string) {
      this.storageUsers = this.storageUsers.filter(storageUser => this.getStorageUserAddress(storageUser) !== address);
      store('storageUsers', this.storageUsers);
    },

    getStorageUserAddress(storageUser: IStorageUser) {
      return storageUser.address || storageUser.vaultAppUser?.eth_address || '';
    },

    clearActiveUser() {
      this._address = '';
      this.privateKey = '';
      this.jwt = '';
      this.vaultAppUser = {} as IVaultAppUser;
      this.clearActiveUserStorage();
    },

    clearActiveUserStorage() {
      store.remove('address');
      store.remove('privateKey');
      store.remove('jwt');
      store.remove('vaultAppUser');
    },

    clear() {
      store.clear();
    },

  };
}

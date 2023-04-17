import { IProfile, IUser, IVaultAppUser } from 'apis/types';
import store from 'store2';
import { utils as etherUtils } from 'ethers';
import { utils as RumSdkUtils } from 'rum-sdk-browser';
import * as Base64 from 'js-base64';

export function createUserStore() {
  return {
    _address: store('address') || '',

    privateKey: store('privateKey') || '',
 
    jwt: store('jwt') || '',

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
        const signingKey = new etherUtils.SigningKey(this.privateKey);
        const pubKeyBuffer = RumSdkUtils.typeTransform.hexToUint8Array(signingKey.compressedPublicKey.replace('0x', ''));
        return Base64.fromUint8Array(pubKeyBuffer, true);
      }
      return '';
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

    setJwt(jwt: string) {
      this.jwt = jwt;
      store('jwt', jwt);
    },

    setVaultAppUser(vaultAppUser: IVaultAppUser | null) {
      if (vaultAppUser) {
        this.vaultAppUser = vaultAppUser;
        store('vaultAppUser', vaultAppUser);
      } else {
        this.vaultAppUser = {} as IVaultAppUser;
        store.remove('vaultAppUser');
      }
    },

    clear() {
      store.clear();
    },

  };
}

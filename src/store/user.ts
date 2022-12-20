import { IProfile, IUser, IVaultAppUser } from 'apis/types';
import store from 'store2';

export function createUserStore() {
  return {
    _address: store('address') || '',

    privateKey: store('privateKey') || '',

    keystore: store('keystore') || '',

    password: store('password') || '',
    
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
      return this.userMap[this.address]!;
    },

    setAddress(address: string) {
      this._address = address;
      store('address', address);
    },

    setPrivateKey(privateKey: string) {
      this.privateKey = privateKey;
      store('privateKey', privateKey);
    },

    setKeystore(keystore: string) {
      this.keystore = keystore;
      store('keystore', keystore);
    },

    setPassword(password: string) {
      this.password = password;
      store('password', password);
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
  };
}

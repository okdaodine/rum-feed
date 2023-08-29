import { IVaultAppUser } from './vault';

export interface IUser {
  postCount: number
  followingCount: number
  followerCount: number
  following?: boolean
  muted?: boolean
  role: 'admin' | ''
  pubKey?: string
}

export interface IStorageUser {
  address?: string
  privateKey?: string
  jwt?: string
  vaultAppUser?: IVaultAppUser
}
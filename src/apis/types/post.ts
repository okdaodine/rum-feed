import { IProfile } from './profile';
import { TrxStorage } from '../common';

export interface IPostContent {
  content: string
  title?: string
  images?: string[]
}

export interface IPost extends IPostContent {
  userAddress: string
  groupId: string
  trxId: string
  latestTrxId: string
  storage: TrxStorage
  timestamp: number
  commentCount: number
  likeCount: number
  hotCount: number
  imageCount: number
  extra: IPostExtra
}

export interface IPostExtra {
  userProfile: IProfile
  liked?: boolean
  groupName: string
}

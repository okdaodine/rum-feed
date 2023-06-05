import { IProfile } from './profile';
import { TrxStorage } from '../common';

export interface IPost {
  content: string
  title?: string
  images?: string[]
  video?: IVideo
  userAddress: string
  groupId: string
  trxId: string
  id: string
  storage: TrxStorage
  timestamp: number
  commentCount: number
  likeCount: number
  imageCount: number
  extra: IPostExtra
}

export interface IPostExtra {
  userProfile: IProfile
  liked?: boolean
  groupName: string
  retweet?: IPost
}

interface IVideo {
  url: string
  poster: string
  duration: string
  width: number
  height: number
}
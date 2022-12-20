import { IProfile } from './profile';
import { TrxStorage } from '../common';

export interface ICommentContent {
  content: string
  objectId: string
  threadId?: string
  replyId?: string
  images?: string[]
}

export interface IComment extends ICommentContent {
  userAddress: string
  groupId: string
  trxId: string
  storage: TrxStorage
  timestamp: number
  commentCount: number
  likeCount: number
  hotCount: number
  extra: ICommentExtra
}

export interface ICommentExtra {
  userProfile: IProfile
  liked?: boolean
  replyComment?: IComment
  comments?: IComment[]
}
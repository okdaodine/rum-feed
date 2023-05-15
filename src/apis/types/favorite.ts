import { IPost } from './post';

export interface IFavorite {
  id: number
  groupId: string
  userAddress: string
  objectType: string
  objectId: string
  extra?: {
    object: IPost
  }
}
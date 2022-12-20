import { IProfile } from './profile';

export interface IRelation {
  id: number
  type: 'following' | 'muted'
  from: string
  to: string
  extra: {
    userProfile: IProfile
  }
}
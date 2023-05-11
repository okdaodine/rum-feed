import { IProfile } from './profile';

export interface IActivity {
  id: number
  groupId: string
  userAddress: string
  type: string
  content: string
  url: string
  timestamp: string
  extra: {
    userProfile: IProfile
  }
}
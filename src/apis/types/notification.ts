import { IPost, IComment, IProfile } from './';

export type NotificationType = 'like' | 'comment' | 'follow';
export type NotificationToObjectType = 'post' | 'comment';

export interface INotification {
  id?: number
  groupId: string
  status: 'read' | 'unread'
  type: NotificationType
  to: string
  toObjectId: string
  toObjectType: NotificationToObjectType
  from: string
  fromObjectId: string
  fromObjectType: 'post' | 'comment' | ''
  timestamp: number
  extra: {
    toObject?: IPost | IComment,
    fromObject?: IPost | IComment,
    fromProfile: IProfile
  }
}
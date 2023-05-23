import { IProfile } from './profile';

export interface IMessage {
  conversationId: string
  fromAddress: string
  fromPubKey: string
  fromContent: string
  toAddress: string
  toPubKey: string
  toContent: string
  timestamp: string
  status: string
}

export interface IConversation {
  conversationId: string
  fromAddress: string
  fromPubKey: string
  fromContent: string
  toAddress: string
  toPubKey: string
  toContent: string
  timestamp: string
  unreadCount: number
  fromUserProfile: IProfile
  toUserProfile: IProfile
}
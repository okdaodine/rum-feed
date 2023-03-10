import { IActivity, IEncryptedContent } from 'rum-sdk-browser';

export interface IV1Content {
  id: number
  trxId: string
  groupId: string
  data: IActivity
  userAddress: string
  status: string
  raw: IEncryptedContent
}
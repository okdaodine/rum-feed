import { IContent as _IContent } from 'quorum-light-node-sdk';

export interface IContent extends _IContent {
  id: number,
  log: string,
  groupId: string
}
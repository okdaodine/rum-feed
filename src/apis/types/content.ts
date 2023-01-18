import { IContent as _IContent } from 'rum-sdk-browser';

export interface IContent extends _IContent {
  id: number,
  log: string,
  groupId: string
}
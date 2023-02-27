import { IGroup as IRawGroup } from 'rum-sdk-browser';

export interface IGroup {
  groupId: string,
  groupName: string,
  groupAlias: string,
  seedUrl: string,
  startTrx: string,
  status: 'connected' | 'disconnected',
  loaded: boolean,
  contentCount: number
  extra: {
    rawGroup: IRawGroup
  }
}
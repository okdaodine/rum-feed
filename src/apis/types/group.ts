import { IGroup as IRawGroup } from 'quorum-light-node-sdk';

export interface IGroup {
  groupId: string,
  groupName: string,
  seedUrl: string,
  startTrx: string,
  status: 'connected' | 'disconnected',
  loaded: boolean,
  contentCount: number
  extra: {
    rawGroup: IRawGroup
  }
}
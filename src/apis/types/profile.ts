import { IImage } from './common';

export interface IProfileTrx {
  Data: IPerson;
  Expired: number;
  GroupId: string;
  SenderPubkey: string;
  SenderSign: string;
  TimeStamp: number;
  TrxId: string;
  Version: string;
}

export interface IPerson {
  name: string
  image?: IImage
}

export interface IProfile extends IPerson {
  name: string
  avatar: string
  userAddress: string
  groupId: string
}
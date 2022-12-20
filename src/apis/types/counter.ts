export interface ILikeTrx {
  Data: {
    type: 'Like' | 'Dislike'
    id: string
  };
  Expired: number;
  GroupId: string;
  SenderPubkey: string;
  SenderSign: string;
  TimeStamp: number;
  TrxId: string;
  Version: string;
}

export interface ILikePayload {
  type: 'Like' | 'Dislike'
  object: {
    id: string
  }
  target: {
    id: string
    type: string
  }
}

export enum CounterName {
  postLike = 'postLike',
  commentLike = 'commentLike',
}

export interface ICounter {
  trxId: string
}

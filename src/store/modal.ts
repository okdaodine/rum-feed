import { IComment } from 'apis/types';
import { IObject } from 'quorum-light-node-sdk';

export interface IPostDetail {
  trxId: string
}

export interface ICommentReplyData {
  postUserAddress: string
  comment: IComment
  submit: (payload: IObject) => void
  where: 'postList' | 'postDetail' | 'postDetailModal'
}

export function createModalStore() {
  return {
    pageLoading: {
      open: false,
      show() {
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },

    postDetail: {
      open: false,
      data: {} as IPostDetail,
      show(data: IPostDetail) {
        this.data = data;
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },

    commentReply: {
      open: false,
      data: {} as ICommentReplyData,
      show(data: ICommentReplyData) {
        this.data = data;
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },
  };
}

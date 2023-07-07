import { IComment } from 'apis/types';
import { IActivity } from 'rum-sdk-browser';

export interface IPostDetail {
  id: string
}

export interface ICommentReplyData {
  postUserAddress: string
  comment: IComment
  submit: (payload: IActivity) => void
  where: 'postList' | 'postDetail' | 'postDetailModal' | 'myComments'
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

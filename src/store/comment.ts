import { groupBy } from 'lodash';
import { runInAction } from 'mobx';
import { IComment } from 'apis/types';

export function createCommentStore() {
  return {
    trxIdsSet: new Set(),

    map: {} as Record<string, IComment>,

    newCommentIdsSet: new Set(),

    selectedComment: null as IComment | null,

    get comments() {
      return this.trxIds.map((rId: string) => this.map[rId]);
    },

    get commentsGroupMap() {
      const map = groupBy(
        this.comments,
        (comment) => comment.objectId,
      ) as Record<string, IComment[]>;
      return map;
    },

    get trxIds() {
      return Array.from(this.trxIdsSet) as string[];
    },

    get subCommentsGroupMap() {
      const map = groupBy(this.comments, (comment) => {
        const { threadId } = comment;
        if (threadId && !this.map[threadId]) {
          return 0;
        }
        return threadId || 0;
      }) as Record<string, IComment[]>;
      delete map[0];
      return map;
    },

    reset() {
      this.trxIdsSet.clear();
      this.map = {};
    },

    addComments(comments: IComment[]) {
      runInAction(() => {
        for (const comment of comments) {
          const { trxId } = comment;
          this.map[trxId] = comment;
          this.trxIdsSet.add(trxId);
          for (const subComment of comment.extra.comments || []) {
            const { trxId } = subComment;
            this.map[trxId] = subComment;
            this.trxIdsSet.add(trxId);
          }
        }
      })
    },

    addComment(comment: IComment) {
      runInAction(() => {
        const { trxId } = comment;
        if (comment.replyId && !comment.extra.replyComment) {
          comment.extra.replyComment = this.map[comment.replyId];
        }
        this.map[trxId] = comment;
        this.trxIdsSet.add(trxId);
        this.newCommentIdsSet.add(comment.trxId);
      })
    },

    updateComment(comment: IComment) {
      const item = this.map[comment.trxId];
      if (item) {
        item.storage = comment.storage;
        item.likeCount = comment.likeCount;
        item.commentCount = comment.commentCount;
        item.extra.liked = comment.extra.liked;
      }
    },

    setSelectedComment(comment: IComment | null) {
      this.selectedComment = comment;
    },

    mobile: {

      openEditorEntryDrawer: false,

      topCommentPage: {
        open: false,
        
        loading: false,

        topComment: null as IComment | null,

        setTopComment(comment: IComment | null) {
          this.topComment = comment;
        },

        setOpen(open: boolean) {
          this.open = open;
        }
      },

      setOpenEditorEntryDrawer(status: boolean) {
        this.openEditorEntryDrawer = status;
      }
    },
  }
}
import { groupBy } from 'lodash';
import { runInAction } from 'mobx';
import { IComment } from 'apis/types';

export function createCommentStore() {
  return {
    idsSet: new Set(),

    map: {} as Record<string, IComment>,

    newCommentIdsSet: new Set(),

    selectedComment: null as IComment | null,

    get comments() {
      return this.ids.map((rId: string) => this.map[rId]);
    },

    get commentsGroupMap() {
      const map = groupBy(
        this.comments,
        (comment) => comment.objectId,
      ) as Record<string, IComment[]>;
      return map;
    },

    get ids() {
      return Array.from(this.idsSet) as string[];
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
      this.idsSet.clear();
      this.map = {};
    },

    addComments(comments: IComment[]) {
      runInAction(() => {
        for (const comment of comments) {
          const { id } = comment;
          this.map[id] = comment;
          this.idsSet.add(id);
          for (const subComment of comment.extra.comments || []) {
            const { id } = subComment;
            this.map[id] = subComment;
            this.idsSet.add(id);
          }
        }
      })
    },

    addComment(comment: IComment) {
      runInAction(() => {
        const { id } = comment;
        if (comment.replyId && !comment.extra.replyComment) {
          comment.extra.replyComment = this.map[comment.replyId];
        }
        this.map[id] = comment;
        this.idsSet.add(id);
        this.newCommentIdsSet.add(comment.id);
      })
    },

    updateComment(comment: IComment) {
      const item = this.map[comment.id];
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
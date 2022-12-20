import { runInAction } from 'mobx';
import { IPost } from 'apis/types';
import store from 'store2';

export type FeedType = 'following' | 'latest' | 'random';

export function createPostStore() {
  return {
    trxIds: [] as string[],

    groupTrxIds: [] as string[],

    userTrxIds: [] as string[],

    searchedTrxIds: [] as string[],

    map: {} as Record<string, IPost>,

    feedType: (store('feedType') || 'latest') as FeedType,

    get total() {
      return this.trxIds.length;
    },

    get groupTotal() {
      return this.groupTrxIds.length;
    },

    get userTotal() {
      return this.userTrxIds.length;
    },

    get searchTotal() {
      return this.searchedTrxIds.length;
    },

    get posts() {
      return this.trxIds.map((rId: string) => this.map[rId]);
    },

    get groupPosts() {
      return this.groupTrxIds.map((rId: string) => this.map[rId]);
    },

    get userPosts() {
      return this.userTrxIds.map((rId: string) => this.map[rId]);
    },

    get searchedPosts() {
      return this.searchedTrxIds.map((rId: string) => this.map[rId]);
    },

    clear() {
      runInAction(() => {
        this.trxIds = [];
        this.map = {};
      })
    },

    addPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.trxIds.includes(post.trxId)) {
            this.trxIds.push(post.trxId);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addPost(post: IPost) {
      runInAction(() => {
        this.trxIds.unshift(post.trxId);
        this.tryAddPostToMap(post);
      })
    },

    addGroupPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.groupTrxIds.includes(post.trxId)) {
            this.groupTrxIds.push(post.trxId);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addUserPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.userTrxIds.includes(post.trxId)) {
            this.userTrxIds.push(post.trxId);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addSearchedPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.searchedTrxIds.includes(post.trxId)) {
            this.searchedTrxIds.push(post.trxId);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addGroupPost(post: IPost) {
      runInAction(() => {
        this.groupTrxIds.unshift(post.trxId);
        this.tryAddPostToMap(post);
      })
    },

    addUserPost(post: IPost) {
      runInAction(() => {
        this.userTrxIds.unshift(post.trxId);
        this.tryAddPostToMap(post);
      })
    },

    tryAddPostToMap(post: IPost) {
      if (!this.map[post.trxId]) {
        this.map[post.trxId] = post;
      }
    },

    removePost(trxId: string) {
      runInAction(() => {
        this.trxIds = this.trxIds.filter(t => t !== trxId);
        this.userTrxIds = this.userTrxIds.filter(t => t !== trxId);
        this.searchedTrxIds = this.searchedTrxIds.filter(t => t !== trxId);
        delete this.map[trxId];
      });
    },

    removePostByUser(address: string) {
      this.trxIds = this.trxIds.filter(trxId => this.map[trxId].userAddress !== address);
    },

    updatePost(post: IPost) {
      const item = this.map[post.trxId];
      if (item) {
        item.storage = post.storage;
        item.likeCount = post.likeCount;
        item.commentCount = post.commentCount;
        item.extra.liked = post.extra.liked;
      }
    },

    resetTrxIds() {
      this.trxIds = [];
    },

    resetGroupTrxIds() {
      this.groupTrxIds = [];
    },

    resetUserTrxIds() {
      this.userTrxIds = [];
    },

    resetSearchedTrxIds() {
      this.searchedTrxIds = [];
    },

    setFeedType(feedType: FeedType) {
      this.feedType = feedType;
      store('feedType', feedType);
    }
  }
}

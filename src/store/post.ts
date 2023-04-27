import { runInAction } from 'mobx';
import { IPost } from 'apis/types';
import store from 'store2';

export type FeedType = 'following' | 'latest' | 'random';

export function createPostStore() {
  return {
    ids: [] as string[],

    groupIds: [] as string[],

    userIds: [] as string[],

    searchedIds: [] as string[],

    map: {} as Record<string, IPost>,

    feedType: (store('feedType') || 'latest') as FeedType,

    get total() {
      return this.ids.length;
    },

    get groupTotal() {
      return this.groupIds.length;
    },

    get userTotal() {
      return this.userIds.length;
    },

    get searchTotal() {
      return this.searchedIds.length;
    },

    get posts() {
      return this.ids.map((rId: string) => this.map[rId]);
    },

    get groupPosts() {
      return this.groupIds.map((rId: string) => this.map[rId]);
    },

    get userPosts() {
      return this.userIds.map((rId: string) => this.map[rId]);
    },

    get searchedPosts() {
      return this.searchedIds.map((rId: string) => this.map[rId]);
    },

    clear() {
      runInAction(() => {
        this.ids = [];
        this.map = {};
      })
    },

    addPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.ids.includes(post.id)) {
            this.ids.push(post.id);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addPost(post: IPost) {
      runInAction(() => {
        this.ids.unshift(post.id);
        this.tryAddPostToMap(post);
      })
    },

    addGroupPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.groupIds.includes(post.id)) {
            this.groupIds.push(post.id);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addUserPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.userIds.includes(post.id)) {
            this.userIds.push(post.id);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addSearchedPosts(posts: IPost[]) {
      runInAction(() => {
        for (const post of posts) {
          if (!this.searchedIds.includes(post.id)) {
            this.searchedIds.push(post.id);
          }
          this.tryAddPostToMap(post);
        }
      });
    },

    addGroupPost(post: IPost) {
      runInAction(() => {
        this.groupIds.unshift(post.id);
        this.tryAddPostToMap(post);
      })
    },

    addUserPost(post: IPost) {
      runInAction(() => {
        this.userIds.unshift(post.id);
        this.tryAddPostToMap(post);
      })
    },

    tryAddPostToMap(post: IPost) {
      if (!this.map[post.id] || post.extra.retweet) {
        this.map[post.id] = post;
        if (post.extra.retweet) {
          this.map[post.extra.retweet.id] = post.extra.retweet;
        }
      }
    },

    removePost(id: string) {
      runInAction(() => {
        this.ids = this.ids.filter(t => t !== id);
        this.groupIds = this.groupIds.filter(t => t !== id);
        this.userIds = this.userIds.filter(t => t !== id);
        this.searchedIds = this.searchedIds.filter(t => t !== id);
        delete this.map[id];
      });
    },

    removePostByUser(address: string) {
      this.ids = this.ids.filter(id => this.map[id].userAddress !== address);
    },

    updatePost(post: IPost) {
      const item = this.map[post.id];
      if (item) {
        item.storage = post.storage;
        item.likeCount = post.likeCount;
        item.commentCount = post.commentCount;
        item.extra.liked = post.extra.liked;
      }
    },

    resetIds() {
      this.ids = [];
    },

    resetGroupIds() {
      this.groupIds = [];
    },

    resetUserIds() {
      this.userIds = [];
    },

    resetSearchedIds() {
      this.searchedIds = [];
    },

    setFeedType(feedType: FeedType) {
      this.feedType = feedType;
      store('feedType', feedType);
    }
  }
}

import { IGroup } from 'apis/types';
import { runInAction } from 'mobx';

export function createGroupStore() {
  return {
    loading: true,

    map: {} as Record<string, IGroup>,

    defaultGroupId: '',

    get defaultGroup() {
      if (this.defaultGroupId && this.map[this.defaultGroupId]) {
        return this.map[this.defaultGroupId];
      }
      return Object.values(this.map).find(group => group.extra.rawGroup.appKey.includes('timeline'))!;
    },

    get relationGroup() {
      return Object.values(this.map).find(group => group.extra.rawGroup.appKey.includes('relations')) || this.defaultGroup;
    },

    get total() {
      return Object.values(this.map).length;
    },

    get multiple() {
      return this.total > 0
    },

    setDefaultGroupId(defaultGroupId: string) {
      this.defaultGroupId = defaultGroupId;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    addGroup(group: IGroup) {
      this.map[group.groupId] = group;
    },

    removeGroup(groupId: string) {
      delete this.map[groupId];
    },

    addGroups(groups: IGroup[]) {
      runInAction(() => {
        for (const group of groups) {
          this.addGroup(group);
        }
      });
    },
  };
}

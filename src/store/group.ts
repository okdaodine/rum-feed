import { IGroup } from 'apis/types';
import { runInAction } from 'mobx';

export function createGroupStore() {
  return {
    loading: true,

    map: {} as Record<string, IGroup>,

    defaultGroupId: '' as string,

    get defaultGroup() {
      if (this.defaultGroupId && this.map[this.defaultGroupId]) {
        return this.map[this.defaultGroupId];
      }
      return Object.values(this.map)[0];
    },

    get multiple() {
      return Object.values(this.map).length > 1;
    },

    get total() {
      return Object.values(this.map).length;
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

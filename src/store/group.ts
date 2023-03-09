import { IGroup } from 'apis/types';
import { runInAction } from 'mobx';

export function createGroupStore() {
  return {
    loading: true,

    map: {} as Record<string, IGroup>,

    get defaultGroup() {
      return Object.values(this.map).find(group => group.groupName.includes('default'))!;
    },

    get postGroup() {
      return Object.values(this.map).find(group => group.groupName.includes('post'))!;
    },

    get total() {
      return Object.values(this.map).length;
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

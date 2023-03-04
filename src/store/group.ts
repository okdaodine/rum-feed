import { IGroup } from 'apis/types';
import { runInAction } from 'mobx';
import { keyBy } from 'lodash';

export function createGroupStore() {
  return {
    loading: true,

    map: {} as Record<string, IGroup>,

    get groups() {
      return Object.values(this.map);
    },

    get defaultGroup() {
      return this.nameMap['default']!;
    },

    get multiple() {
      return this.groups.length > 1;
    },

    get total() {
      return this.groups.length;
    },

    get nameMap() {
      return keyBy(this.groups, group => group.groupName.toLowerCase());
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

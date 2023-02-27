import { IGroup } from 'apis/types';
import { runInAction } from 'mobx';
import { keyBy } from 'lodash';

export function createGroupStore() {
  return {
    loading: true,

    map: {} as Record<string, IGroup>,

    defaultGroupId: '' as string,

    get groups() {
      return Object.values(this.map);
    },

    get defaultGroup() {
      if (this.defaultGroupId && this.map[this.defaultGroupId]) {
        return this.map[this.defaultGroupId];
      }
      return this.groups[1];
    },

    get multiple() {
      return this.groups.length > 1;
    },

    get total() {
      return this.groups.length;
    },

    get nameMap() {
      return keyBy(this.groups, 'groupName');
    },

    getPublicGroupId(groupId: string) {
      const group = this.map[groupId];
      return (this.nameMap[`Public.${group.groupName}`] || group).groupId;
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

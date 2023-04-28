import store from 'store2';

export function createRelationStore() {
  return {
    muted: new Set(store('muted') || []) as Set<string>,

    mutedMe: new Set(store('mutedMe') || []) as Set<string>,

    setMuted(muted: string[]) {
      this.muted = new Set(muted);
      store('muted', muted);
    },

    setMutedMe(mutedMe: string[]) {
      this.mutedMe = new Set(mutedMe);
      store('mutedMe', mutedMe);
    }
  };
}

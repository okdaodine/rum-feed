export function createRelationStore() {
  return {
    muted: new Set() as Set<string>,

    mutedMe: new Set() as Set<string>,

    setMuted(muted: string[]) {
      this.muted = new Set(muted);
    },

    setMutedMe(mutedMe: string[]) {
      this.mutedMe = new Set(mutedMe);
    }
  };
}

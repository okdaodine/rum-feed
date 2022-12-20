export function createPathStore() {
  const paths: any = [];
  return {
    paths,
    push(path: string) {
      this.paths.push(path);
    },
    pop() {
      this.paths.pop();
    },
  };
}

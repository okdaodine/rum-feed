import sleep from 'utils/sleep';

export function createSnackbarStore() {
  return {
    open: false,
    message: '',
    type: 'default',
    meta: {},
    show(options: any = {}) {
      (async () => {
        this.close();
        const { message, duration = 1500, type, meta = {} } = options;
        this.message = message;
        this.type = type || 'default';
        const autoHideDuration = type === 'error' ? duration + 500 : duration;
        this.open = true;
        this.meta = meta;
        await sleep(autoHideDuration);
        this.close();
      })();
    },
    close() {
      this.open = false;
    },
  };
}

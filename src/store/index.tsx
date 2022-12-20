import React from 'react';
import { toJS, observable } from 'mobx';
import { createSnackbarStore } from './snackbar';
import { createConfirmDialogStore } from './confirmDialog';
import { createModalStore } from './modal';
import { createUserStore } from './user';
import { createPostStore } from './post';
import { createCommentStore } from './comment';
import { createGroupStore } from './group';
import { createPathStore } from './path';
import { createSettingStore } from './setting';
import { createConfigStore } from './config';

const storeContext = React.createContext<any>(null);

const createStore = () => ({
  snackbarStore: observable(createSnackbarStore()),
  confirmDialogStore: observable(createConfirmDialogStore()),
  modalStore: observable(createModalStore()),
  userStore: observable(createUserStore()),
  postStore: observable(createPostStore()),
  commentStore: observable(createCommentStore()),
  groupStore: observable(createGroupStore()),
  pathStore: observable(createPathStore()),
  settingStore: observable(createSettingStore()),
  configStore: observable(createConfigStore()),
});

export interface Store {
  snackbarStore: ReturnType<typeof createSnackbarStore>
  confirmDialogStore: ReturnType<typeof createConfirmDialogStore>
  modalStore: ReturnType<typeof createModalStore>
  userStore: ReturnType<typeof createUserStore>
  postStore: ReturnType<typeof createPostStore>
  commentStore: ReturnType<typeof createCommentStore>
  groupStore: ReturnType<typeof createGroupStore>
  pathStore: ReturnType<typeof createPathStore>
  settingStore: ReturnType<typeof createSettingStore>
  configStore: ReturnType<typeof createConfigStore>
}

export const store = createStore();

export const StoreProvider = ({ children }: { children: React.ReactNode }) => (
  <storeContext.Provider value={store}>{children}</storeContext.Provider>
);

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('You have forgot to use StoreProvider');
  }
  (window as any).toJS = toJS;
  (window as any).store = store;
  return store as Store;
};

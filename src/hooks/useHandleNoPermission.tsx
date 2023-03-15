import React from 'react';
import { Store } from 'store';
import sleep from 'utils/sleep';
import store2 from 'store2';

export default (store: Store) => {
  const { userStore, confirmDialogStore, modalStore } = store;

  return React.useCallback(() => {
    if (userStore.vaultAppUser.status === 'no_nft') {
      const { nft_info } = userStore.vaultAppUser;
      confirmDialogStore.show({
        content: `目前您可以点赞和评论，但需要持有 <strong>${nft_info?.name}</strong> 才可以发布内容哦 <img src="${nft_info!.icon_url}" class="mt-4 mx-auto w-20 h-20 rounded-12 mb-2 animate-scale-sm" />`,
        cancelText: '我知道了',
        okText: '去买一个',
        ok: () => {
          confirmDialogStore.okText = '跳转中';
          confirmDialogStore.setLoading(true);
          window.location.href = nft_info!.buy_url;
        },
      });
    } else if (userStore.vaultAppUser.status === 'token_expired') {
      confirmDialogStore.show({
        content: `状态已过期，需要重新登录哦`,
        cancelText: '我知道了',
        okText: '重新登录',
        ok: async () => {
          confirmDialogStore.hide();
          await sleep(400);
          store2.clear();
          modalStore.pageLoading.show();
          window.location.href = `/?action=openLoginModal`;
        },
      });
    } else if (!['web3', 'mixin'].includes(userStore.vaultAppUser.provider)) {
      confirmDialogStore.show({
        content: `当前帐号只能点赞和评论，只有使用 Mixin 或者 MetaMask 登录、而且持有 NFT 才能发布内容哦`,
        cancelText: '我知道了',
        okText: '切换账号',
        ok: async () => {
          confirmDialogStore.hide();
          await sleep(500);
          confirmDialogStore.show({
            content: '确定退出当前帐号吗？',
            ok: async () => {
              confirmDialogStore.hide();
              await sleep(400);
              store2.clear();
              modalStore.pageLoading.show();
              window.location.href = `/?action=openLoginModal`;
            },
          });
        },
      });
    } else {
      confirmDialogStore.show({
        content: `貌似出错了，请刷新页面再试试`,
        cancelDisabled: true,
        okText: '点击刷新',
        ok: () => {
          window.location.reload();
        },
      });
    }
  }, []);
}
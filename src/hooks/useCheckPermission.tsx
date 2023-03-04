import React from 'react';
import { Store } from 'store';
// import sleep from 'utils/sleep';
import { ContractApi } from 'apis';

export default (store: Store) => {
  const { snackbarStore, userStore } = store;

  return React.useCallback(async (groupName: string) => {
    const [mainnet, contractAddress] = groupName.split('.');
    try {
      const nfts = await ContractApi.checkUserAddress({
        mainnet,
        contractAddress,
        userAddress: userStore.address
      });
      console.log({ nfts });
      if (nfts.length === 0) {
        snackbarStore.show({
          message: `You don't have this NFT`,
          type: 'error',
        });
        return false;
      }
      return true;
    } catch (err: any) {
      console.log(err);
      snackbarStore.show({
        message: err.message,
        type: 'error',
      });
    }
    return false;
    // confirmDialogStore.show({
    //   content: '持有一个 BoredApeYachtClub NFT 就能发送内容，你是否已经持有？',
    //   cancelText: '我还没有',
    //   okText: '是的',
    //   ok: async () => {
    //     confirmDialogStore.okText = 'Checking'
    //     confirmDialogStore.setLoading(true);
    //     await sleep(2000);
    //     console.log('发送 check API，带上 address');
    //     confirmDialogStore.hide();
    //   },
    // });
  }, []);
}
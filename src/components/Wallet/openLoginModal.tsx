import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Modal from 'components/Modal';
import { useStore } from 'store';
import { ethers } from 'ethers';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import openWalletModal from './openWalletModal';
import ImportModal from './ImportModal';
import * as Vault from 'utils/vault';

const Main = observer(() => {
  const { userStore } = useStore();
  const state = useLocalObservable(() => ({
    loadingMetaMask: false,
    creatingWallet: false,
    loadingMixin: false,
    openImportModal: false
  }));

  const connectWallet = (address: string, privateKey: string) => {
    userStore.saveAddress(address);
    userStore.savePrivateKey(privateKey);
  }

  return (
    <div className="box-border px-14 pt-6 md:pt-8 pb-10 md:w-[320px]">
      <div className="text-17 font-bold dark:text-white dark:text-opacity-80 text-neutral-700 text-center opacity-90">
        {lang.connectWallet}
      </div>
      <div className="justify-center mt-6 md:mt-4 w-full hidden md:flex">
        <Button
          className="tracking-widest"
          fullWidth
          onClick={async () => {
            state.loadingMixin = true;
            const {
              aesKey,
              keyInHex
            } = await Vault.createKey();
            await Vault.saveCryptoKeyToLocalStorage(aesKey);
            window.location.href = Vault.getMixinOauthUrl({
              state: keyInHex,
              return_to: encodeURIComponent(window.location.href),
              scope: 'PROFILE:READ+COLLECTIBLES:READ'
            });
          }}
        >
          Mixin 登录{state.loadingMixin && '...'}
        </Button>
      </div>
      <div className="justify-center mt-6 md:mt-4 w-full flex">
        <Button
          className="tracking-widest"
          fullWidth
          onClick={async () => {
            state.creatingWallet = true;
            await sleep(10);
            const wallet = ethers.Wallet.createRandom();
            await sleep(200);
            const done = await openWalletModal(wallet.privateKey);
            state.creatingWallet = false;
            if (done) {
              connectWallet(wallet.address, wallet.privateKey);
              window.location.href += '?action=openProfileEditor';
            }
          }}
        >
          {lang.createWallet}{state.creatingWallet && '...'}
        </Button>
      </div>
      <div className="justify-center mt-6 md:mt-4 w-full flex">
        <Button
          className="tracking-widest"
          fullWidth
          onClick={async () => {
            state.openImportModal = true;
          }}
        >
          {lang.importWallet}
        </Button>
      </div>
      <ImportModal
        open={state.openImportModal}
        onClose={() => {
          state.openImportModal = false;
        }}
      />
    </div>
  )
});

const ModalWrapper = observer((props: {
  close: (result?: any) => void
}) => {
  const state = useLocalObservable(() => ({
    open: false,
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const close = (result?: any) => {
    state.open = false;
    props.close(result);
  }

  return (
    <Modal open={state.open} onClose={() => close()}>
      <Main />
    </Modal>
  )
});


export default () => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <ModalWrapper
            close={() => {
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};

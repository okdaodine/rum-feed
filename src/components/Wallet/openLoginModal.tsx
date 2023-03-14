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
import { VaultApi } from 'apis';
import rumSDK from 'rum-sdk-browser';

const Main = observer(() => {
  const { userStore, confirmDialogStore, snackbarStore } = useStore();
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
      <div className="justify-center mt-6 md:mt-4 w-full">
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
      <div className="justify-center mt-6 md:mt-4 w-full hidden md:flex">
        <Button
          className="tracking-widest"
          fullWidth
          onClick={async () => {
            if (!(window as any).ethereum) {
              confirmDialogStore.show({
                content: '请先安装 MetaMask 插件',
                cancelText: '我知道了',
                okText: '去安装',
                ok: () => {
                  confirmDialogStore.okText = '跳转中';
                  confirmDialogStore.setLoading(true);
                  window.location.href = 'https://metamask.io';
                },
              });
              return;
            }
            state.loadingMetaMask = true;
            try {
              const { typeTransform } = rumSDK.utils;
              const PREFIX = '\x19Ethereum Signed Message:\n';
              const message = `Rum 身份认证 | ${Math.round(Date.now() / 1000)}`;
              const provider = new ethers.providers.Web3Provider((window as any).ethereum);
              const accounts = await provider.send("eth_requestAccounts", []);
              const address = accounts[0];
              const messageBytes = ethers.utils.toUtf8Bytes(message);
              const msg = `0x${typeTransform.uint8ArrayToHex(messageBytes)}`;
              const signatureFromProvider = await provider.send("personal_sign", [msg, address]);
              const signature = ethers.utils.joinSignature(signatureFromProvider);
              console.log(`[MetaMask]:`, { address, message, signature });
              const _messageBytes = ethers.utils.toUtf8Bytes(message);
              const prefixBytes = ethers.utils.toUtf8Bytes(`${PREFIX}${messageBytes.length}`);
              const bytes = ethers.utils.concat([prefixBytes, _messageBytes]);
              const rawMsg = ethers.utils.toUtf8String(bytes);
              const hash = ethers.utils.keccak256(bytes).toString();
              const digest = typeTransform.hexToUint8Array(hash);
              const recoveredAddress = ethers.utils.recoverAddress(digest, signature);
              console.log(`[MetaMask]:`, { recoveredAddress });
              if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                throw new Error('invalid address');
              }
              const { token }: any = await VaultApi.createUserBySignature({
                address: recoveredAddress,
                data: rawMsg,
                signature: signature.replace('0x', '')
              });
              window.location.href = `/?token=${token}`;
            } catch (err: any) {
              if (err.message === 'invalid address') {
                snackbarStore.show({
                  message: '加解密的 address 不匹配',
                  type: 'error'
                });
              } else {
                snackbarStore.show({
                  message: lang.somethingWrong,
                  type: 'error',
                });
              }
              state.loadingMetaMask = false;
            }
          }}
        >
          MetaMask 登录{state.loadingMetaMask && '...'}
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

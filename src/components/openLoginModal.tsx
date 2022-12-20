import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Modal from 'components/Modal';
import { useStore } from 'store';
import { ethers } from 'ethers';
import store from 'store2';
import KeystoreModal from './KeystoreModal';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import * as Vault from 'utils/vault';
import QuorumLightNodeSDK from 'quorum-light-node-sdk';
import { VaultApi } from 'apis';
import { lang } from 'utils/lang';

const Main = observer(() => {
  const { userStore, modalStore, snackbarStore, confirmDialogStore } = useStore();
  const state = useLocalObservable(() => ({
    loadingMixin: false,
    loadingMetaMask: false,
    loadingGithub: false,
    loadingRandom: false,
    openKeystoreModal: false,
  }));

  return (
    <div className="box-border px-14 pt-6 md:pt-8 pb-10 md:w-[320px]">
      <div className="text-17 font-bold dark:text-white dark:text-opacity-80 text-neutral-700 text-center opacity-90">
        选择登录方式
      </div>
      <div className="flex justify-center w-full mt-[30px] md:mt-6">
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
              const { typeTransform } = QuorumLightNodeSDK.utils;
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
            state.loadingGithub = true;
            const {
              aesKey,
              keyInHex
            } = await Vault.createKey();
            await Vault.saveCryptoKeyToLocalStorage(aesKey);
            window.location.href = Vault.getGithubOauthUrl({
              state: keyInHex,
              return_to: encodeURIComponent(window.location.href)
            });
          }}
        >
          Github 登录{state.loadingGithub && '...'}
        </Button>
      </div>
      <div className="justify-center mt-6 md:mt-4 w-full flex">
        <Button
          className="tracking-widest"
          fullWidth
          onClick={async () => {
            state.loadingRandom = true;
            await sleep(200);
            const wallet = ethers.Wallet.createRandom();
            const password = "123";
            const keystore = await wallet.encrypt(password, {
              scrypt: {
                N: 64
              }
            });
            modalStore.pageLoading.show();
            userStore.setKeystore(keystore.replaceAll('\\', ''));
            userStore.setPassword(password);
            userStore.setAddress(wallet.address);
            userStore.setPrivateKey(wallet.privateKey);
            store.remove('groupStatusMap');
            store.remove('lightNodeGroupMap');
            window.location.href += '?action=openProfileEditor';
          }}
        >
          {state.loadingRandom ? '正在创建帐号...' : '使用随机帐号'}
        </Button>
      </div>
      <div className="dark:text-white dark:text-opacity-80 text-gray-88 opacity-60 mt-5 md:mt-[10px] text-center">
        <span className="cursor-pointer text-12" onClick={() => {
          state.openKeystoreModal = true;
        }}>密钥登录</span>
      </div>
      <KeystoreModal
        switchingAccount
        open={state.openKeystoreModal}
        onClose={() => {
        state.openKeystoreModal = false;
      }} />
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

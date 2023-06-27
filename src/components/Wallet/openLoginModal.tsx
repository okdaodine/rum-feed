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
import PhoneModal from './PhoneModal';
import MailModal from './MailModal';
import * as Vault from 'utils/vault';
import { VaultApi } from 'apis';
import { utils as RumSdkUtils } from 'rum-sdk-browser';
import { AiOutlineGithub } from 'react-icons/ai';
import { isPc } from 'utils/env';

const Main = observer(() => {
  const { userStore, confirmDialogStore, snackbarStore, configStore } = useStore();
  const state = useLocalObservable(() => ({
    creatingWallet: false,
    openImportModal: false,
    openPhoneModal: false,
    openMailModal: false,
    loadingMixin: false,
    loadingMetaMask: false,
    loadingGithub: false,
  }));
  const { walletProviders } = configStore.config;
  const phoneEnabled = walletProviders?.includes('phone');
  const emailEnabled = walletProviders?.includes('email');
  const mixinEnabled = walletProviders?.includes('mixin');
  const metamaskEnabled = walletProviders?.includes('metamask') && isPc;
  const githubEnabled = walletProviders?.includes('github');


  const connectWallet = (address: string, privateKey: string) => {
    userStore.saveAddress(address);
    userStore.savePrivateKey(privateKey);
  }

  const loginWithMixin = async () => {
    state.loadingMixin = true;
    const {
      aesKey,
      keyInHex
    } = await Vault.createKey();
    await Vault.saveCryptoKeyToLocalStorage(aesKey);
    window.location.href = Vault.getMixinOauthUrl({
      state: keyInHex,
      return_to: encodeURIComponent(window.location.href),
      scope: 'PROFILE:READ'
    });
  };

  const loginWithGithub = async () => {
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
  };

  const loginWithMetaMask = async () => {
    if (!(window as any).ethereum) {
      confirmDialogStore.show({
        content: lang.installMetaMaskFirst,
        cancelText: lang.gotIt,
        okText: lang.install,
        ok: () => {
          confirmDialogStore.okText = lang.redirecting;
          confirmDialogStore.setLoading(true);
          window.location.href = 'https://metamask.io';
        },
      });
      return;
    }
    state.loadingMetaMask = true;
    try {
      const { typeTransform } = RumSdkUtils;
      const PREFIX = '\x19Ethereum Signed Message:\n';
      const message = `Session: ${Math.round(Date.now() / 1000)}`;
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
          message: lang.mismatchedAddress,
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
  };

  return (
    <div className="box-border px-14 pt-6 md:pt-8 pb-5 md:pb-10 md:w-[320px]">
      <div className="text-17 font-bold dark:text-white dark:text-opacity-80 text-neutral-700 text-center opacity-90 md:-mt-2">
        {lang.connectWallet}
      </div>
      {phoneEnabled && (
        <div className="justify-center mt-5 md:mt-4 w-full">
          <Button
            className="tracking-widest"
            fullWidth
            onClick={() => {
              state.openPhoneModal = true;
            }}
          >
            {lang.phone}
          </Button>
        </div>
      )}
      {emailEnabled && (
        <div className="justify-center mt-5 md:mt-4 w-full">
          <Button
            className="tracking-widest"
            fullWidth
            onClick={() => {
              state.openMailModal = true;
            }}
          >
            {lang.email}
          </Button>
        </div>
      )}
      <div className="justify-center mt-5 md:mt-4 w-full flex">
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
      <div className="justify-center mt-5 md:mt-4 w-full flex">
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
      {(mixinEnabled || metamaskEnabled || githubEnabled) && (
        <div className="pt-5">
          <div className="flex items-center justify-center">
            <span className="h-px bg-gray-300 dark:bg-white/20 w-[56px] mr-2" />
            <span className="dark:text-white/50 opacity-50 text-12">{lang.otherLoginMethods}</span>
            <span className="h-px bg-gray-300 dark:bg-white/20 w-[56px] ml-2" />
          </div>
          <div className="pt-4">
            <div className="flex justify-center">
              {mixinEnabled && (
                <div className="text-center cursor-pointer px-3 md:px-[10px]" onClick={loginWithMixin}>
                  <div className="mx-auto border dark:border-white/20 border-gray-300/70 rounded-full w-[50px] h-[50px] flex items-center justify-center">
                    <img className="w-[28px]" src="/mixin-logo.png" alt="mixin" />
                  </div>
                  <div className="mt-1 text-12 opacity-50 tracking-wider md:tracking-wide">Mixin{state.loadingMixin && '...'}</div>
                </div>
              )}
              {metamaskEnabled && (
                <div className="text-center cursor-pointer px-3 md:px-[10px]" onClick={loginWithMetaMask}>
                  <div className="mx-auto border dark:border-white/20 border-gray-300/70 rounded-full w-[50px] h-[50px] flex items-center justify-center">
                  <img className="w-[28px]" src="/metamask.svg" alt="metamask" />
                  </div>
                  <div className="mt-1 text-12 opacity-50 tracking-wider md:tracking-wide">MetaMask{state.loadingMetaMask && '...'}</div>
                </div>
              )}
              {githubEnabled && (
                <div className="text-center cursor-pointer px-3 md:px-[10px]" onClick={loginWithGithub}>
                  <div className="mx-auto border dark:border-white/20 border-gray-300/70 rounded-full w-[50px] h-[50px] flex items-center justify-center">
                    <AiOutlineGithub className="text-[32px] opacity-80" />
                  </div>
                  <div className="mt-1 text-12 opacity-50 tracking-wider md:tracking-wide">Github{state.loadingGithub && '...'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ImportModal
        open={state.openImportModal}
        onClose={() => {
          state.openImportModal = false;
        }}
      />
      <PhoneModal
        open={state.openPhoneModal}
        onClose={() => {
          state.openPhoneModal = false;
        }}
      />
      <MailModal
        open={state.openMailModal}
        onClose={() => {
          state.openMailModal = false;
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

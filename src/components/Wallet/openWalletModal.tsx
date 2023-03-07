import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Button from 'components/Button';
import { RiKey2Fill } from 'react-icons/ri';
import copy from 'copy-to-clipboard';
import { useStore } from 'store';
import { BiCopy } from 'react-icons/bi';
import MiddleTruncate from 'components/MiddleTruncate';
import KeystoreGeneratorModal from './KeystoreGeneratorModal';

interface IProps {
  privateKey: string
  rs: (done: boolean) => void
}

const ModalWrapper = observer((props: IProps) => {
  const { snackbarStore, userStore } = useStore();
  const state = useLocalObservable(() => ({
    open: false,
    openKeystoreGeneratorModal: false
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const handleClose = (done: boolean) => {
    state.open = false;
    props.rs(done);
  };

  return (
    <Modal open={state.open} onClose={() => handleClose(false)}>
      <div className="p-8 relative w-full md:w-[400px] box-border">
        <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center">
          <div className="flex items-center justify-center">
            {lang.wallet}
          </div>
        </div>
        <div className="mt-8">
          <div className="flex">
            <div className="dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-2 pb-3 px-4">
              {lang.privateKey}
            </div>
          </div>
          <div className="-mt-3 justify-center bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-3 px-4 md:px-5 pb-3 leading-7 tracking-wide">
            <div className="flex items-center py-[2px] cursor-pointer" onClick={() => {
              copy(props.privateKey);
              snackbarStore.show({
                message: lang.copied,
              });
            }}>
              <div className="w-[22px] h-[22px] box-border flex items-center justify-center dark:text-white dark:text-opacity-80 text-gray-500 text-12 mr-[10px] rounded-full opacity-90">
                <RiKey2Fill className="text-20" />
              </div>
              <div className="text-12 md:text-13 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2">
                <MiddleTruncate string={props.privateKey} length={13} />
              </div>
              <BiCopy className="text-sky-500 text-20" />
            </div>
          </div>
          <div className="text-12 dark:text-white/40 text-gray-500/70 text-center pt-[6px]">
            ({lang.copyAndSaveYourPrivateKey})
          </div>
        </div>
        <Button
          className="w-full mt-8"
          onClick={() => {
            handleClose(true);
        }}>{userStore.isLogin ? lang.close : lang.done}</Button>
        <div className="text-12 dark:text-white/60 text-gray-500/70 text-center pt-[10px] cursor-pointer" onClick={() => {
          state.openKeystoreGeneratorModal = true;
        }}>
          {lang.generateJsonWallet}
        </div>
        <KeystoreGeneratorModal
          privateKey={props.privateKey}
          open={state.openKeystoreGeneratorModal}
          onClose={() => state.openKeystoreGeneratorModal = false}
        />
      </div>
    </Modal>
  )
});

export default async (privateKey: string) => new Promise((rs) => {
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
            privateKey={privateKey}
            rs={(done: boolean) => {
              rs(done);
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});
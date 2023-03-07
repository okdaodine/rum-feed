import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { lang } from 'utils/lang';
import Button from 'components/Button';
import { useStore } from 'store';
import { TextField } from '@material-ui/core';
import KeystoreImportModal from './KeystoreImportModal';
import { ethers } from 'ethers';
import sleep from 'utils/sleep';

interface IProps {
  open: boolean
  onClose: () => void
}

const Main = observer((props: IProps) => {
  const { snackbarStore, userStore } = useStore();
  const state = useLocalObservable(() => ({
    privateKey: '',
    openKeystoreImportModal: false,
  }));

  const importWallet = async (privateKey: string) => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      userStore.saveAddress(wallet.address);
      userStore.savePrivateKey(wallet.privateKey);
      snackbarStore.show({
        message: lang.done,
      });
      await sleep(1000);
      window.location.reload();
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  }

  return (
    <div className="p-8 relative w-full md:w-[320px] box-border">
      <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center">
        <div className="flex items-center justify-center">
          {lang.importWallet}
        </div>
      </div>
      <div className="pt-6 px-2">
        <TextField
          name='privateKey'
          label={lang.privateKey}
          value={state.privateKey}
          onChange={(e) => { state.privateKey = e.target.value; }}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') {
              importWallet(state.privateKey);
            }
          }}
          variant="outlined"
          fullWidth
          margin="dense"
        />
      </div>
      <Button
        className="w-full mt-8"
        onClick={() => {
          importWallet(state.privateKey);
        }}
      >
        {lang.ok}
      </Button>
      <div className="text-12 dark:text-white/60 text-gray-500/70 text-center pt-[10px] cursor-pointer" onClick={() => {
        state.openKeystoreImportModal = true;
      }}>
        {lang.importJsonWallet}
      </div>
      <KeystoreImportModal
        importWallet={importWallet}
        open={state.openKeystoreImportModal}
        onClose={() => {
          state.openKeystoreImportModal = false;
        }}
      />
    </div>
  )
});


export default observer((props: IProps) => (
  <Modal hideCloseButton open={props.open} onClose={() => props.onClose()}>
    <Main {...props} />
  </Modal>
));

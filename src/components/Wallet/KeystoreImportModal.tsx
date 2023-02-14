import { observer, useLocalObservable } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { useStore } from 'store';
import { ethers } from 'ethers';
import Modal from 'components/Modal';
import { lang } from 'utils/lang';

interface IProps {
  importWallet: (privateKey: string) => void
  open: boolean
  onClose: () => void
}

const Keystore = observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    processing: false,
    keystore: '',
    password: '',
    percent: 0
  }));

  const importKeystore = async () => {
    if (state.processing) {
      return;
    }
    state.processing = true;
    try {
      const wallet = await ethers.Wallet.fromEncryptedJson(state.keystore, state.password, (percent) => {
        state.percent = parseInt(`${percent * 100}`, 10);
      });
      props.importWallet(wallet.privateKey);
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: (err as any).message,
        type: 'error',
        duration: 2000
      });
      state.processing = false;
    }
  }

  return (
    <div className="p-8 pt-6 w-full md:w-[560px]">
       <TextField
        multiline
        name='keystore'
        label={lang.jsonWallet}
        value={state.keystore}
        minRows={10}
        maxRows={10}
        onChange={(e) => { state.keystore = e.target.value; }}
        variant="outlined"
        fullWidth
        margin="dense"
      />
      <div className="mt-4" />
      <TextField
        name='password'
        label={lang.password}
        value={state.password}
        onChange={(e) => { state.password = e.target.value; }}
        onKeyDown={(e: any) => {
          if (e.key === 'Enter') {
            importKeystore();
          }
        }}
        variant="outlined"
        fullWidth
        margin="dense"
      />
      <div className="flex justify-center">
        <Button className="mt-8 w-full md:w-auto" onClick={importKeystore}>{state.processing ? `${lang.processing} ${state.percent}%` : lang.ok}</Button>
      </div>
    </div>
  )
})


export default observer((props: IProps) => (
  <Modal hideCloseButton open={props.open} onClose={() => props.onClose()}>
    <Keystore {...props} />
  </Modal>
));

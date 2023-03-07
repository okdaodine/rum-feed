import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { lang } from 'utils/lang';
import Button from 'components/Button';
import copy from 'copy-to-clipboard';
import { useStore } from 'store';
import { BiCopy } from 'react-icons/bi';
import MiddleTruncate from 'components/MiddleTruncate';
import { TextField } from '@material-ui/core';
import { ethers } from 'ethers';

interface IProps {
  privateKey: string
  open: boolean
  onClose: () => void
}

const Main = observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    password: '',
    keystore: '',
    generating: false,
    progress: 0
  }));

  const generate = async (privateKey: string) => {
    if (state.generating) {
      return;
    }
    state.keystore = '';
    state.generating = true;
    const wallet = new ethers.Wallet(privateKey);
    const json = await wallet.encrypt(state.password, (progress: any) => {
      state.progress = parseInt(`${progress * 100}`, 10);
    });
    state.keystore = json;
    state.generating = false;
  }

  return (
    <div className="p-8 relative w-full md:w-[360px] box-border">
      <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center">
        <div className="flex items-center justify-center">
          {lang.generateJsonWallet}
        </div>
      </div>
      <div className="pt-6 px-2">
        <TextField
          name='password'
          label={lang.password}
          value={state.password}
          onChange={(e) => { state.password = e.target.value; }}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') {
              generate(props.privateKey);
            }
          }}
          variant="outlined"
          fullWidth
          margin="dense"
        />
      </div>
      {state.keystore && (
        <div>
          <div className="flex mt-5">
            <div className="dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-2 pb-3 px-4">
              {lang.jsonWallet}
            </div>
          </div>
          <div className="-mt-3 justify-center bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-3 px-4 md:px-5 pb-3 leading-7 tracking-wide">
            <div className="flex items-center py-[2px] cursor-pointer" onClick={() => {
              copy(state.keystore);
              snackbarStore.show({
                message: lang.copied,
              });
            }}>
              <div className="text-12 md:text-13 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2 truncate">
                <MiddleTruncate string={state.keystore} length={14} />
              </div>
              <BiCopy className="text-sky-500 text-20" />
            </div>
          </div>
          <div className="text-12 dark:text-white/40 text-gray-500/70 text-center pt-[6px]">
            ({lang.copyAndSaveYourJsonWallet})
          </div>
        </div>
      )}
      {!state.keystore && (  
        <Button
          className="w-full mt-8"
          disabled={!state.password}
          onClick={() => {
            generate(props.privateKey);
          }}
        >
          {state.generating ? `${lang.processing} ${state.progress}%` : lang.generate}
        </Button>
      )}
      {state.keystore && (
        <Button
          className="w-full mt-8"
          onClick={() => {
            props.onClose()
          }}
        >
          {lang.done}
        </Button>
      )}
    </div>
  )
});


export default observer((props: IProps) => (
  <Modal hideCloseButton open={props.open} onClose={() => props.onClose()}>
    <Main {...props} />
  </Modal>
));

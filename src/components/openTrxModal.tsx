import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { ITrx } from 'quorum-light-node-sdk';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import { useStore } from 'store';
import MiddleTruncate from 'components/MiddleTruncate';
import { TrxApi } from 'apis';

interface IProps {
  groupId: string
  trxId: string
}

interface IModalProps extends IProps {
  rs: (result: boolean) => void
}

const ModalWrapper = observer((props: IModalProps) => {
  const state = useLocalObservable(() => ({
    open: false,
    loading: true,
    trx: {} as ITrx,
  }));
  const { snackbarStore } = useStore();

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const handleClose = (result: any) => {
    state.open = false;
    props.rs(result);
  };

  React.useEffect(() => {
    (async () => {
      try {
        state.trx = await TrxApi.get(props.groupId, props.trxId);
        state.loading = false;
      } catch (err) {
        console.error(err);
        snackbarStore.show({
          message: lang.failToLoad,
          type: 'error',
        });
      }
    })();
  }, [props.trxId]);

  return (
    <Modal open={state.open} onClose={() => handleClose(false)}>
      <div className=" p-8 relative w-full md:w-[540px] h-[90vh] md:h-auto box-border">
        <div className="pt-2 px-6 pb-5">
          <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center pb-5">
            {lang.blockInfo}
          </div>
          <div className="p-6 dark:text-white dark:text-opacity-80 text-gray-88 text-13 border dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-d8 rounded-0 shadow">
            <div className="flex items-center">
              <span className="w-22">ID：</span>
              <span className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-90">{state.trx.TrxId}</span>
            </div>
            <div className="mt-4 flex items-center">
              <span className="w-22">{lang.group} ID：</span>
              <span className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-90">{state.trx.GroupId}</span>
            </div>
            <div className="mt-4 flex items-center">
              <span className="w-22">{lang.sender}：</span>
              <span className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-90">
                <MiddleTruncate string={state.trx.SenderPubkey} length={15} />
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className="w-22">{lang.data}：</span>
              <span className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-90">
                <MiddleTruncate string={state.trx.Data} length={15} />
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className="w-22">{lang.sign}：</span>
              <span className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-90">
                <MiddleTruncate string={state.trx.SenderSign} length={15} />
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className="w-22">{lang.timestamp}：</span>
              <span className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-90">
                {state.trx.TimeStamp}
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className="w-22">{lang.version}：</span>
              <span className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-90">{state.trx.Version}</span>
            </div>
          </div>
        </div>
        {state.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818]">
            <Loading size={24} />
          </div>
        )}
      </div>
    </Modal>
  )
});

export default async (props: IProps) => new Promise((rs) => {
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
            {...props}
            rs={() => {
              rs(true);
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});
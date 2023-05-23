import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { ITrx } from 'rum-sdk-browser';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import { useStore } from 'store';
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
          message: lang.somethingWrong,
          type: 'error',
        });
      }
    })();
  }, [props.trxId]);

  return (
    <Modal open={state.open} onClose={() => handleClose(false)}>
      <div className="py-8 px-0 md:px-8 relative w-full md:w-[540px] h-[90vh] md:h-auto box-border overflow-y-auto">
        <div className="pt-2 px-6 pb-5">
          <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center pb-5">
            {lang.onChainInfo}
          </div>
          <div className="p-2 leading-normal break-all tracking-wide">

            <div className="inline-block dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-ec dark:bg-neutral-800 rounded-0 pt-2 pb-3 px-4 rounded-t-12">
              ID
            </div>
            <div className="-mt-3 justify-center bg-gray-ec dark:bg-neutral-800 rounded-0 pt-3 px-4 md:px-5 pb-3 rounded-12 rounded-lt-none">
              <div className="flex items-center py-[2px] cursor-pointer">
                <div className="text-12 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2">
                  {state.trx.TrxId}
                </div>
              </div>
            </div>

            <div className="mt-6 inline-block dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-ec dark:bg-neutral-800 rounded-0 pt-2 pb-3 px-4 rounded-t-12">
              {lang.group} ID
            </div>
            <div className="-mt-3 justify-center bg-gray-ec dark:bg-neutral-800 rounded-0 pt-3 px-4 md:px-5 pb-3 rounded-12 rounded-lt-none">
              <div className="flex items-center py-[2px] cursor-pointer">
                <div className="text-12 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2">
                  {state.trx.GroupId}
                </div>
              </div>
            </div>

            <div className="mt-6 inline-block dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-ec dark:bg-neutral-800 rounded-0 pt-2 pb-3 px-4 rounded-t-12">
              {lang.sender}
            </div>
            <div className="-mt-3 justify-center bg-gray-ec dark:bg-neutral-800 rounded-0 pt-3 px-4 md:px-5 pb-3 rounded-12 rounded-lt-none">
              <div className="flex items-center py-[2px] cursor-pointer">
                <div className="text-12 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2">
                  {state.trx.SenderPubkey}
                </div>
              </div>
            </div>

            <div className="mt-6 inline-block dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-ec dark:bg-neutral-800 rounded-0 pt-2 pb-3 px-4 rounded-t-12">
              {lang.sign}
            </div>
            <div className="-mt-3 justify-center bg-gray-ec dark:bg-neutral-800 rounded-0 pt-3 px-4 md:px-5 pb-3 rounded-12 rounded-lt-none">
              <div className="flex items-center py-[2px] cursor-pointer">
                <div className="text-12 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2">
                  {state.trx.SenderSign}
                </div>
              </div>
            </div>

            <div className="mt-6 inline-block dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-ec dark:bg-neutral-800 rounded-0 pt-2 pb-3 px-4 rounded-t-12">
              {lang.timestamp}
            </div>
            <div className="-mt-3 justify-center bg-gray-ec dark:bg-neutral-800 rounded-0 pt-3 px-4 md:px-5 pb-3 rounded-12 rounded-lt-none">
              <div className="flex items-center py-[2px] cursor-pointer">
                <div className="text-12 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2">
                  {state.trx.TimeStamp}
                </div>
              </div>
            </div>

            <div className="mt-6 inline-block dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-ec dark:bg-neutral-800 rounded-0 pt-2 pb-3 px-4 rounded-t-12">
              {lang.version}
            </div>
            <div className="-mt-3 justify-center bg-gray-ec dark:bg-neutral-800 rounded-0 pt-3 px-4 md:px-5 pb-3 rounded-12 rounded-lt-none">
              <div className="flex items-center py-[2px] cursor-pointer">
                <div className="text-12 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-2">
                  {state.trx.Version}
                </div>
              </div>
            </div>
          </div>
        </div>
        {true && (
          <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-[#181818]">
            <div className="-mt-20">
              <Loading />
            </div>
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
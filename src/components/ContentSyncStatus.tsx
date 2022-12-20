import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import sleep from 'utils/sleep';
import usePrevious from 'hooks/usePrevious';
import Tooltip from '@material-ui/core/Tooltip';
import { RiCheckDoubleFill, RiCheckLine } from 'react-icons/ri';
import { lang } from 'utils/lang';
import { TrxStorage } from 'apis/common';

interface IProps {
  trxId: string
  storage: TrxStorage
  SyncedComponent?: any
  positionClassName?: string
  alwaysShow?: boolean
}

export default observer((props: IProps) => {
  const { storage, SyncedComponent } = props;
  const prevStorage = usePrevious(storage);
  const state = useLocalObservable(() => ({
    showSuccessChecker: false,
    showTrxStatusModal: false,
  }));

  React.useEffect(() => {
    if (
      prevStorage === TrxStorage.cache
      && storage === TrxStorage.chain
    ) {
      (async () => {
        state.showSuccessChecker = true;
        await sleep(2000);
        state.showSuccessChecker = false;
      })();
    }
  }, [prevStorage, storage]);

  return (
    <div>
      {storage === TrxStorage.cache && (
        <Tooltip placement="top" title={lang.syncingContentTip2} arrow>
          <div
            className={`${
              props.positionClassName || 'mt-[-2px]'
            } rounded-full dark:text-white dark:text-opacity-40 text-gray-af text-12 leading-none font-bold tracking-wide cursor-default`}
            onClick={() => {
              state.showTrxStatusModal = true;
            }}
          >
            <RiCheckLine className="text-18" />
          </div>
        </Tooltip>
      )}
      {state.showSuccessChecker && (
        <div
          className={`${
            props.positionClassName || 'mt-[-2px]'
          } rounded-full text-emerald-400 opacity-80  text-12 leading-none font-bold tracking-wide`}
        >
          <RiCheckDoubleFill className="text-18" />
        </div>
      )}
      {storage === TrxStorage.chain
        && !state.showSuccessChecker
        && SyncedComponent && (
        <div
          className={props.alwaysShow ? '' : 'invisible group-hover:visible'}
          data-test-id="synced-timeline-item-menu"
        >
          <SyncedComponent />
        </div>
      )}
    </div>
  );
});

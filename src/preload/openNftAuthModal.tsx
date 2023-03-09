import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Modal from 'components/Modal';
import { useStore } from 'store';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { PermissionApi } from 'apis';

const Main = observer((props: {
  iconUrl: string
  close: (result?: any) => void
}) => {
  const { userStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    step: -1,
    done: false,
  }));

  React.useEffect(() => {
    let stop = false;
    (async () => {
      await sleep(200);
      state.step = 0;
      await sleep(1000);
      state.step = 1;
      await sleep(3000);
      state.step = 2;
      await sleep(2000);
      state.step = 3;
      await sleep(2000);
      state.step = 4;
      await sleep(2000);
      while (!stop) {
        try {
          const { vaultAppUser } = userStore;
          await PermissionApi.get(groupStore.defaultGroup.groupId, vaultAppUser.eth_pub_key);
          userStore.setVaultAppUser({
            ...userStore.vaultAppUser,
            status: 'allow'
          });
          state.done = true;
          stop = true;
        } catch (_err) {}
        await sleep(1000);
      }
      state.step = 5;
      await sleep(1000);
      state.step = 6;
    })();
    return () => {
      stop = true;
    }
  }, []);

  return (
    <div className="box-border px-14 pt-6 md:pt-8 pb-10">
      <div className="dark:text-white dark:text-opacity-80 text-neutral-700 text-center opacity-90 leading-loose text-15">
        <div className={`${state.step >= 0 ? "animate-fade-in" : 'invisible'}`}>欢迎您</div>
        <div className={`${state.step >= 1 ? "animate-fade-in" : 'invisible'}`}>正在查看您的 NFT，请稍候...</div>
        <div className={`${state.step >= 2 ? "animate-fade-in" : 'invisible'}`}>已确认您是 CNFT 的持有者！</div>
        <img className={`${state.step >= 3 ? "animate-scale-sm" : 'invisible'} mt-3 mx-auto w-20 h-20 rounded-12 mb-3 border border-gray-d8 border-opacity-70 dark:border-white dark:border-opacity-[0.05]`} src={props.iconUrl} alt="cnft" />
        <div className={`${state.step >= 4 ? "animate-fade-in" : 'invisible'}`}>正在为您开通权限，请稍候...</div>
        <div className={`${state.step >= 5 ? "animate-fade-in" : 'invisible'}`}>已完成！</div>
        <div className={`${state.step >= 6 ? "animate-fade-in" : 'invisible'} mt-4 flex justify-center`}>
          <Button fullWidth onClick={() => props.close()}>开始使用</Button>
        </div>
      </div>
    </div>
  )
});

const ModalWrapper = observer((props: {
  iconUrl: string
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
      <Main iconUrl={props.iconUrl} close={close} />
    </Modal>
  )
});


export default (iconUrl: string) => {
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
            iconUrl={iconUrl}
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

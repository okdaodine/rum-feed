import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Modal from 'components/Modal';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { TextField } from '@material-ui/core';
import { useStore } from 'store';
import { TweetApi } from 'apis';
import { lang } from 'utils/lang';
import { isPc } from 'utils/env';
import Loading from 'components/Loading';

interface IModalProps  {
  close: () => void
}

const Main = observer((props: IModalProps) => {
  const { snackbarStore, groupStore, userStore, confirmDialogStore } = useStore();
  const state = useLocalObservable(() => ({
    url: '',
    submitting: false,
    loading: true,
    isUpdating: false,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        await sleep(300);
        const { url } = await TweetApi.get(groupStore.defaultGroup.groupId, userStore.address);
        state.url = url || '';
        state.isUpdating = !!url;
      } catch (err) {}
      state.loading = false;
    })();
  }, []);
 
  const submit = async () => {
    if (
      (!state.isUpdating && !state.url.includes('https://twitter.com')) ||
      (state.isUpdating && state.url && !state.url.includes('https://twitter.com'))
    ) {
      return snackbarStore.show({
        message: '请输入正确的链接',
        type: 'error',
      });
    }
    try {
      if (state.isUpdating) {
        if (state.url === '') {
          confirmDialogStore.show({
            content: '确定删除推特帐号吗？',
            ok: async () => {
              confirmDialogStore.hide();
              await sleep(400);
              state.submitting = true;
              await sleep(400);
              await TweetApi.remove(groupStore.defaultGroup.groupId, userStore.address);
              await sleep(1000);
              state.submitting = false;
              props.close();
              await sleep(400);
              snackbarStore.show({
                message: '已删除推特帐号',
              });
            },
          });
        } else {
          state.submitting = true;
          await sleep(300);
          await TweetApi.update(groupStore.defaultGroup.groupId, userStore.address, {
            url: state.url
          });
          await sleep(1000);
          state.submitting = false;
          props.close();
          await sleep(400);
          snackbarStore.show({
            message: '修改成功',
          });
        }
      } else {
        state.submitting = true;
        await sleep(300);
        await TweetApi.create(groupStore.defaultGroup.groupId, {
          url: state.url,
          pubKey: userStore.vaultAppUser.eth_pub_key,
          remoteSignToken: userStore.jwt
        });
        await sleep(1000);
        state.submitting = false;
        props.close();
        await sleep(400);
        confirmDialogStore.show({
          content: '添加成功！当您的推特帐号发布新内容时，大约 10-20 分钟后会同步到这里',
          cancelDisabled: true,
          okText: '我知道了',
          ok: () => {
            confirmDialogStore.hide();
          },
        });
      }
    } catch (err: any) {
      console.log(err);
      if (err.message.includes('duplicated')) {
        snackbarStore.show({
          message: '已经添加过了哦',
          type: 'error',
        });
      } else if (err.message.includes('limit')) {
        snackbarStore.show({
          message: 'limit 不能超过 100 哦',
          type: 'error',
        });
      } else {
        snackbarStore.show({
          message: lang.somethingWrong,
          type: 'error',
        });
      }
    }
    state.submitting = false;
  }

  return (
    <div className="py-8 px-10 md:w-[350px] box-border relative">
      <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-neutral-700 text-center">同步抓取您的推特账户</div>
      <div className="pt-5 relative">
        <TextField
          fullWidth
          label="输入推特账户的主页链接"
          size="small"
          value={state.url}
          autoFocus={isPc}
          onChange={(e) => { state.url = e.target.value.trim() }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
              submit();
            }
          }}
          margin="dense"
          variant="outlined"
        />
      </div>
      <div className="mt-6 flex justify-center">
        <Button
          fullWidth
          isDoing={state.submitting}
          disabled={!state.isUpdating && !state.url}
          onClick={submit}
        >
          保存
        </Button>
      </div>
      {state.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818] z-10">
          <Loading size={24} />
        </div>
      )}
    </div>
  )
});

const ModalWrapper = observer((props: IModalProps) => {
  const state = useLocalObservable(() => ({
    open: false,
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const close = () => {
    state.open = false;
    props.close();
  }

  return (
    <Modal open={state.open} onClose={() => close()}>
      <Main {...props} close={close} />
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

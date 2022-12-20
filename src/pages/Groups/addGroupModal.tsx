import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { useStore } from 'store';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import { GroupApi, SeedApi } from 'apis';
import { IGroup } from 'apis/types';
import QuorumLightNodeSDK from 'quorum-light-node-sdk';
import Loading from 'components/Loading';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import Fade from '@material-ui/core/Fade';

interface IProps {
  open: boolean
  onClose: () => void
  addGroup: (group: IGroup) => void
}

const Main = observer((props: IProps) => {
  const { snackbarStore, confirmDialogStore } = useStore();
  const state = useLocalObservable(() => ({
    seedUrl: '',
    submitting: false,
    loading: false,
    loaded: false,
    stopPolling: false,
    group: {} as IGroup
  }));

  React.useEffect(() => {
    return () => {
      state.stopPolling = true;
    }
  }, [])
 
  const submit = async () => {
    try {
      const group = QuorumLightNodeSDK.utils.seedUrlToGroup(state.seedUrl);
      if (group.chainAPIs.length === 0) {
        return snackbarStore.show({
          message: '缺少有效的 chainAPIs',
          type: 'error',
        });
      }
      if (group.appKey !== 'group_timeline' && group.appKey !== 'group_relations') {
        return snackbarStore.show({
          message: '请添加 group_timeline 类型的种子网络',
          type: 'error',
          duration: 3000,
        });
      }
    } catch (err) {
      return snackbarStore.show({
        message: '无法解析这个种子',
        type: 'error',
      });
    }
    state.submitting = true;
    await sleep(300);
    try {
      const group = await SeedApi.create(state.seedUrl);
      state.group = group;
      state.submitting = false;
      state.loading = true;
      state.stopPolling = false;
      let disconnectedCount = 0;
      while (!state.stopPolling) {
        await sleep(2000);
        if (state.stopPolling) {
          return;
        }
        try {
          const latestGroup = await GroupApi.get(group.groupId);
          state.group = latestGroup;
          if (latestGroup.status === 'disconnected') {
            disconnectedCount++;
          } else {
            disconnectedCount = 0;
          }
          if (latestGroup.loaded || disconnectedCount === 5) {
            state.stopPolling = true;
            if (latestGroup.loaded) {
              state.loading = false;
              state.loaded = true;
              await sleep(1500);
            }
            props.onClose();
            await sleep(400);
            props.addGroup(latestGroup);
            await sleep(50);
            window.scrollTo({
              behavior: 'smooth',
              top: 9999
            });
            await sleep(200);
            if (latestGroup.loaded) {
              snackbarStore.show({
                message: '添加成功'
              });
            } else {
              confirmDialogStore.show({
                content: '添加成功，但种子中提供的 API 无法访问，所以暂时没有同步到任何数据',
                okText: '我知道了',
                cancelDisabled: true,
                ok: () => {
                  confirmDialogStore.hide();
                },
              });
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err: any) {
      console.log(err);
      if (err.message.includes('duplicated')) {
        snackbarStore.show({
          message: '该种子已经添加过了哦',
          type: 'error',
        });
      } else if (err.code === 'ERR_NOT_PERMISSION') {
        snackbarStore.show({
          message: '您还没有权限执行这个操作，请让站长给您加权限',
          type: 'error',
          duration: 4000
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
    <div className="bg-white dark:bg-[#181818] py-8 px-10 w-[350px] box-border">
      <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center">添加种子网络</div>
      <div className="pt-4 relative">
        <TextField
          className="w-full"
          placeholder="粘贴种子文本"
          size="small"
          multiline
          minRows={6}
          maxRows={6}
          value={state.seedUrl}
          autoFocus
          onChange={(e) => { state.seedUrl = e.target.value.trim() }}
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
        {state.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818]">
            <Fade in={true} timeout={350}>
              <Loading size={40} />
            </Fade>
          </div>
        )}
        {state.loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818]">
            <Fade in={true} timeout={350}>
              <BsFillCheckCircleFill className="text-[64px]" />
            </Fade>
          </div>
        )}
      </div>
      {!state.loading && !state.loaded && (
        <div className="mt-4 flex justify-center">
          <Button
            fullWidth
            isDoing={state.submitting}
            disabled={!state.seedUrl}
            onClick={submit}
          >
            确定
          </Button>
        </div>
      )}
      {(state.loading || state.loaded) && (
        <div className="text-center dark:text-white dark:text-opacity-80 text-gray-88 leading-7">
          {state.group.contentCount === 0 && (
            <span>新添加的种子网络需要同步内容 <br /></span>
          )}
          {state.group.contentCount > 0 && (
            <span>已同步 {state.group.contentCount} 条内容 <br /></span>
          )}
          <span>请稍候... <br /></span>
          <span>如果内容比较多 <br /></span>
          <span>您可以关闭此窗口 <br /></span>
          <span>后台会继续同步数据的<br /></span>
        </div>
      )}
    </div>
  )
});

export default observer((props: IProps) => {
  const { open, onClose } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Main { ...props } />
    </Modal>
  );
});

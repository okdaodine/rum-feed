import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { IGroup, IContent } from 'apis/types';
import { GroupApi, ContentApi } from 'apis';
import Loading from 'components/Loading';
import { useStore } from 'store';
import Tooltip from '@material-ui/core/Tooltip';
import copy from 'copy-to-clipboard';
import Modal from 'components/Modal';
import { MdOutlineErrorOutline } from 'react-icons/md';
import { FaSeedling } from 'react-icons/fa';
import { BiCopy, BiSearch } from 'react-icons/bi';
import Button from 'components/Button';

interface IModalProps {
  groupId: string
  rs: (result: boolean) => void
}

const Main = observer((props: IModalProps) => {
  const { snackbarStore, confirmDialogStore } = useStore();
  const state = useLocalObservable(() => ({
    group: {} as IGroup,
    loading: true,
    open: false,
    contents: [] as IContent[],
    hasMoreContent: true,
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);
  
  React.useEffect(() => {
    (async () => {
      try {
        const group = await GroupApi.get(props.groupId);
        await fetchMoreContents();
        state.group = group;
      } catch (err) {
        console.log(err);
        snackbarStore.show({
          message: lang.somethingWrong,
          type: 'error',
        });
      }
      state.loading = false;
    })();
  }, []);

  const fetchMoreContents = async () => {
    try {
      const contents = await ContentApi.list(props.groupId, {
        offset: state.contents.length,
        limit: 10,
        minimal: true
      });
      state.contents.push(...contents);
      if (contents.length < 10) {
        state.hasMoreContent = false;
      }
    } catch (err) {
      console.log(err);
    }
  }

  const handleClose = (result: any) => {
    state.open = false;
    props.rs(result);
  };

  const remove = () => {
    confirmDialogStore.show({
      content: '确定移除这个种子网络吗？<div class="text-12">（同时移除掉已同步的内容）</div>',
      ok: async () => {
        try {
          await GroupApi.remove(props.groupId);
          confirmDialogStore.hide();
          handleClose('removed');
        } catch (err: any) {
          if (err.code === 'ERR_NOT_PERMISSION') {
            snackbarStore.show({
              message: '您还没有权限执行这个操作，请让站长给您加权限',
              type: 'error',
              duration: 4000
            });
          }
        }
      },
    });
  }

  return (
    <Modal open={state.open} onClose={() => handleClose(false)}>
      <div className="h-[90vh] md:h-[70vh] overflow-y-auto  p-8 px-5 md:px-10 box-border">
        <div className="w-full md:w-[455px]">
          {state.loading && (
            <div className="py-32">
              <Loading />
            </div>
          )}
          {!state.loading && (
            <div>
              <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center">
                <div className="flex items-center justify-center">
                  {state.group.groupName}
                </div>
                <div className="mt-1 text-12 opacity-40">
                  {state.group.groupId}
                </div>
              </div>
              <div className="mt-8">
                <div className="flex">
                  <div className="dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-2 pb-3 px-4">
                    种子
                  </div>
                </div>
                <div className="-mt-3 justify-center bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-3 px-4 md:px-6 pb-3 leading-7 tracking-wide">
                    <Tooltip
                      enterDelay={300}
                      enterNextDelay={300}
                      placement="left"
                      title="点击复制"
                      arrow
                      interactive
                    >
                    <div className="flex items-center py-[2px] cursor-pointer" onClick={() => {
                      copy(state.group.seedUrl);
                      snackbarStore.show({
                        message: lang.copied,
                      });
                    }}>
                      <div className="w-[22px] h-[22px] box-border flex items-center justify-center dark:bg-white bg-black dark:text-black text-white text-12 mr-[10px] rounded-full opacity-90">
                        <FaSeedling className="text-12" />
                      </div>
                      <div className="text-12 md:text-13 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-1 truncate">{state.group.seedUrl}</div>
                      <BiCopy className="mr-2 text-sky-500 text-16" />
                    </div>
                  </Tooltip>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex">
                  <div className="dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-2 pb-3 px-4">
                    节点
                  </div>
                </div>
                <div className="-mt-3 justify-center bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-3 px-4 md:px-6 pb-3 leading-7 tracking-wide">
                  {state.group.status === 'disconnected' && (
                    <div className="flex items-center justify-center bg-red-400 dark:text-black text-white px-2 text-12 rounded-12 mb-2 py-1 leading-none">
                      <MdOutlineErrorOutline className="mr-1 text-18" /> 节点都访问不了，无法连接
                    </div>
                  )}
                  {state.group.extra.rawGroup.chainAPIs.map((api, i) => (
                    <Tooltip
                      key={api}
                      enterDelay={300}
                      enterNextDelay={300}
                      placement="left"
                      title="点击复制"
                      arrow
                      interactive
                    >
                      <div className="flex items-center py-[2px] cursor-pointer" onClick={() => {
                        copy(api);
                        snackbarStore.show({
                          message: lang.copied,
                        });
                      }}>
                        <div className="w-[22px] h-[22px] box-border flex items-center justify-center dark:bg-white bg-black dark:text-black text-white text-12 mr-[10px] rounded-full opacity-90">{i + 1}</div>
                        <div className="text-12 md:text-13 dark:text-white dark:text-opacity-80 text-gray-88 flex-1 pr-1 truncate">{api}</div>
                        <BiCopy className="mr-2 text-sky-500 text-16" />
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
              {state.contents.length > 0 && (
                <div className="mt-8">
                  <div className="flex">
                    <div className="dark:text-white dark:text-opacity-80 text-gray-500 font-bold bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-2 pb-3 px-4">
                      区块
                    </div>
                  </div>
                  <div className="-mt-3 justify-center bg-gray-100 dark:bg-black dark:bg-opacity-70 rounded-0 pt-3 px-4 md:px-6 pb-3 leading-7 tracking-wide">
                    {state.contents.map((content, index) => (
                      <Tooltip
                        key={content.id}
                        enterDelay={300}
                        enterNextDelay={300}
                        leaveDelay={300}
                        placement="left"
                        title={<ContentDetail content={content} />}
                        arrow
                        interactive
                        >
                        <div className="flex items-center py-[2px] cursor-pointer">
                          <div className="min-w-[22px] h-[22px] py-1 px-2 box-border flex items-center justify-center dark:bg-white bg-black dark:text-black text-white text-12 mr-[10px] rounded-full opacity-90">{state.group.contentCount - index}</div>
                          <span className="text-12 md:text-13 dark:text-white dark:text-opacity-80 text-gray-88 truncate">{content.TrxId}</span>
                          <BiSearch className="ml-2 dark:text-white dark:text-opacity-80 text-gray-88 text-16 opacity-80" />
                        </div>
                      </Tooltip>
                    ))}
                    {state.hasMoreContent && (
                      <div className="text-center pt-1 text-12" onClick={fetchMoreContents}>
                        <span className="text-sky-500 cursor-pointer">加载更多</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Button className="w-full mt-8" color="red" outline onClick={remove}>移除</Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
});

const ContentDetail = observer((props: {
  content: IContent
}) => {
  const state = useLocalObservable(() => ({
    loading: true,
    content: null as (IContent | null),
  }));

  React.useEffect(() => {
    (async () => {
      try {
        state.content = await ContentApi.get(props.content.groupId, props.content.TrxId);
      } catch (err) {
        console.log(err);
      }
      state.loading = false;
    })();
  }, []);

  return (
    <div className="py-5 mx-4 text-12 tracking-wide text-left w-[250px] overflow-x-auto leading-5 min-h-[100px]">
      {state.loading && (
        <div className="py-2 flex justify-center">
          <Loading />
        </div>
      )}
      {!state.loading && (
        <div>
          {state.content && <pre dangerouslySetInnerHTML={{ __html: JSON.stringify(state.content.Data, null, 2) }} />}
          {!state.content && (
            <div className="text-center py-2 opacity-70">
              没有找到内容
            </div>
          )}
        </div>
      )}
    </div>
  )
});

export default async (groupId: string) => new Promise((rs) => {
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
          <Main
            groupId={groupId}
            rs={(result: any) => {
              rs(result);
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});
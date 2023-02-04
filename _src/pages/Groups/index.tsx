import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { BiChevronRight } from 'react-icons/bi';
import { RiAddFill } from 'react-icons/ri';
import AddGroupModal from './addGroupModal';
import { GroupApi } from 'apis';
import { IGroup } from 'apis/types';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';
import Loading from 'components/Loading';
import classNames from 'classnames';
import openGroupInfo from 'components/openGroupInfo';
import { runInAction } from 'mobx';
import { getMixinContext } from 'utils/env';
import { MdOutlineErrorOutline } from 'react-icons/md';
import TopPlaceHolder from 'components/TopPlaceHolder';

export default observer(() => {
  const { snackbarStore, groupStore, configStore } = useStore();
  const state = useLocalObservable(() => ({
    openAddGroupModal: false,
    loading: true,
    idSet: new Set() as Set<string>,
    map: {} as Record<string, IGroup>,
    get groups() {
      return Array.from(this.idSet).map(id => this.map[id]);
    },
  }));

  React.useEffect(() => {
    document.title = configStore.config.title || 'Rum 微博广场';
  }, []);

  React.useEffect(() => {
    (async () => {
      await sleep(300);
      try {
        const groups = await GroupApi.list();
        runInAction(() => {
          for (const group of groups) {
            state.idSet.add(group.groupId);
            state.map[group.groupId] = group;
          }
        });
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

  if (state.loading) {
    return (
      <div className="pt-[30vh] flex justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="w-full md:w-[360px] mx-auto">
      <TopPlaceHolder />
      <div className="px-4 md:px-0 py-6 md:py-12">
        {getMixinContext().isMixinImmersive && (
          <div className="pt-[5vh]" />
        )}
        {state.groups.map(group => (
          <div className="bg-white dark:bg-[#181818] rounded-full shadow-xl w-full flex justify-between items-center pt-5 pb-4 px-8 md:px-10 border dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-ec leading-none mb-8" key={group.groupId}>
            <div>
              <div className="flex items-center">
                <span className="font-bold text-18 md:text-20 dark:text-white dark:text-opacity-80 text-gray-33 tracking-wider truncate max-w-[180px] md:max-w-[280px]">
                  {group.groupName}
                </span>
              </div>
              <div className="mt-[15px] dark:text-white dark:text-opacity-80 text-gray-9b flex items-center cursor-pointer" onClick={async () => {
                const result = await openGroupInfo(group.groupId);
                if (result === 'removed') {
                  await sleep(500);
                  state.idSet.delete(group.groupId);
                  delete state.map[group.groupId];
                  await sleep(300);
                  snackbarStore.show({
                    message: '已移除',
                  });
                }
              }}>
                {group.status === 'connected' && (
                  <div className="flex items-center">
                    连接<span className="text-emerald-500 font-bold mx-[6px]">{group.extra.rawGroup.chainAPIs.length}</span>个节点
                  </div>
                )}
                {group.status === 'disconnected' && (
                  <div className="flex items-center bg-red-400 dark:text-black text-white p-1 px-2 text-12 rounded-12 mr-2 text-center">
                    <MdOutlineErrorOutline className="text-16 mr-1" /> 节点无法访问
                  </div>
                )}
                <div>
                  {group.contentCount > 0 && (
                    <div>
                      {group.status === 'connected' && '，'}同步<span className="dark:text-white dark:text-opacity-80 text-gray-64 font-bold mx-[6px]">{group.contentCount}</span>条内容
                    </div>
                  )}
                </div>
                {(group.status === 'connected' || group.contentCount > 0) && <BiChevronRight className="text-18 ml-[2px]" />}
              </div>
            </div>
          </div>
        ))}
        <div className={classNames({
          'w-10 h-10': state.groups.length > 0,
          'h-16': state.groups.length === 0
        }, "items-center justify-center mx-auto mt-10 dark:bg-white bg-black rounded-full cursor-pointer dark:text-black text-white hidden md:flex")} onClick={() => {
          state.openAddGroupModal = true;
        }}>
          <RiAddFill className="text-26" />
          {state.groups.length === 0 && (
            <div className="ml-2">添加种子网络</div>
          )}
        </div>

        <AddGroupModal
          open={state.openAddGroupModal}
          onClose={() => state.openAddGroupModal = false}
          addGroup={group => {
            if (groupStore.loading) {
              window.location.reload();
              return;
            }
            state.idSet.add(group.groupId);
            state.map[group.groupId] = group;
            groupStore.addGroup(group);
          }}
        />
      </div>
    </div>
  )
})
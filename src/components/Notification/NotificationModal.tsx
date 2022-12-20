import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Badge from '@material-ui/core/Badge';
import Loading from 'components/Loading';
import BottomLine from 'components/BottomLine';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { lang } from 'utils/lang';
import CommentMessages from './CommentMessages';
import LikeMessages from './LikeMessages';
import FollowMessages from './FollowMessages';
import { INotification, NotificationType } from 'apis/types';
import { NotificationApi } from 'apis';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import { runInAction } from 'mobx';
import Modal from 'components/Modal';
import { useHistory } from 'react-router-dom';

interface IProps {
  open: boolean
  onClose: () => void
  addReadCount: (count: number) => void
}

interface ITab {
  unreadCount: number
  text: string
  type: NotificationType
}

const TabLabel = (tab: ITab) => (
  <div className="relative">
    <div className="absolute top-0 right-0 -mt-2 -mr-2">
      <Badge
        badgeContent={tab.unreadCount}
        className="scale-75 cursor-pointer"
        color="error"
        overlap="rectangular"
      />
    </div>
    {tab.text}
  </div>
);

const LIMIT = 10;

const Notification = observer((props: IProps) => {
  const { userStore } = useStore();
  const history = useHistory();
  const tabs = [
    {
      unreadCount: 0,
      text: lang.like,
      type: 'like'
    },
    {
      unreadCount: 0,
      text: lang.comment,
      type: 'comment',
    },
    {
      unreadCount: 0,
      text: '关注',
      type: 'follow',
    }
  ] as ITab[];
  const state = useLocalObservable(() => ({
    fetched: false,
    loading: false,
    loadingMore: false,
    hasMore: true,
    tabIndex: 0,
    idSet: new Set() as Set<number>,
    map: {} as Record<string, INotification>,
    page: 1,
    tabs: tabs,
    get offset() {
      return (this.page - 1) * LIMIT
    },
    get tab() {
      return this.tabs[this.tabIndex]
    },
    get notifications() {
      return Array.from(this.idSet).map((id: number) => this.map[id]);
    },
    unreadCount: 0
  }));

  React.useEffect(() => {
    if (state.loading) {
      return;
    }
    state.loading = true;
    (async () => {
      try {
        for (const tab of state.tabs) {
          tab.unreadCount = await NotificationApi.getUnreadCount(userStore.address, tab.type);
        }
        state.unreadCount = state.tab.unreadCount;
        if (!state.fetched) {
          await sleep(200);
        }
        const notifications = await NotificationApi.list(userStore.address, state.tab.type, {
          offset: state.offset,
          limit: LIMIT
        });
        runInAction(() => {
          for (const item of notifications) {
            state.idSet.add(item.id!);
            state.map[item.id!] = item;
          }
        })
        if (notifications.length < LIMIT) {
          state.hasMore = false;
        }
      } catch (err) {
        console.error(err);
      }
      state.loading = false;
      state.fetched = true;
      await sleep(250);
      props.addReadCount(state.tab.unreadCount);
      state.tab.unreadCount = 0;
    })();
  }, [state.tab, state.page]);

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.loading,
    hasNextPage: state.hasMore,
    rootMargin: '0px 0px 200px 0px',
    onLoadMore: () => {
      if (state.loading) {
        return;
      }
      state.page += 1;
    },
  });

  const toUserPage = async (userAddress: string) => {
    props.onClose();
    await sleep(400);
    const path = `/users/${userAddress}`;
    if (window.location.pathname !== path) {
      history.push(path);
    } 
  }

  return (
    <div className="w-full h-[90vh] md:h-[80vh] md:w-[550px] flex flex-col">
      <Tabs
        className="px-8 relative bg-white dark:bg-[#181818] z-0 md:z-10 with-border flex-none mt-2"
        value={state.tabIndex}
        onChange={(_e, newIndex) => {
          if (state.loading || state.tabIndex === newIndex) {
            return;
          }
          runInAction(() => {
            state.fetched = false;
            state.hasMore = true;
            state.tabIndex = newIndex;
            state.page = 1;
            state.idSet.clear();
            state.map = {};
          });
        }}
      >
        {state.tabs.map((_tab, idx: number) => <Tab key={idx} label={TabLabel(_tab)} />)}
      </Tabs>
      <div className="flex-1 h-0 overflow-y-auto px-3 md:px-8" ref={rootRef}>
        {!state.fetched && (
          <div className="pt-32">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <div className="py-1 md:py-4">
            {state.tab.type === 'like' && 
              <LikeMessages
                notifications={state.notifications}
                unreadCount={state.unreadCount}
                close={props.onClose}
                toUserPage={toUserPage}
              />
            }
            {state.tab.type === 'comment' && 
              <CommentMessages
                notifications={state.notifications}
                unreadCount={state.unreadCount}
                close={props.onClose}
                toUserPage={toUserPage}
              />
            }
            {state.tab.type === 'follow' && 
              <FollowMessages
                notifications={state.notifications}
                unreadCount={state.unreadCount}
                close={props.onClose}
                toUserPage={toUserPage}
              />
            }
            {state.notifications.length === 0 && (
              <div className="py-28 text-center text-14 dark:text-white dark:text-opacity-80 text-gray-400 opacity-80">
                {lang.empty(lang.message)}
              </div>
            )}
          </div>
        )}
        {state.fetched && state.loading && (
          <div className="pt-3 pb-5">
            <Loading />
          </div>
        )}
        {state.notifications.length > 5 && !state.hasMore && (
          <div className="pb-5">
            <BottomLine />
          </div>
        )}
        <div ref={sentryRef} />
      </div>
    </div>
  );
});


export default observer((props: IProps) => {
  return (
    <Modal open={props.open} onClose={() => props.onClose()}>
      <Notification { ...props } />
    </Modal>
  )
});

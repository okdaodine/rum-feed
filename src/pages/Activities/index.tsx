import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { IActivity } from 'apis/types';
import { ActivityApi } from 'apis';
import Loading from 'components/Loading';
import ago from 'utils/ago';
import { lang } from 'utils/lang';
import { TbActivity } from 'react-icons/tb';
import { useHistory } from 'react-router-dom';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Fade from '@material-ui/core/Fade';
import store from 'store2';
import { isMobile, isPc } from 'utils/env';
import { useStore } from 'store';

export default observer(() => {
  const { userStore } = useStore();
  const state = useLocalObservable(() => ({
    activities: [] as IActivity[],
    fetched: false,
    loading: true,
    page: 0,
    hasMore: true,
    lastReadActivityId: store('lastReadActivityId')
  }));
  const history = useHistory();

  React.useEffect(() => {
    document.title = lang.activities;
  }, []);

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      try {
        const limit = 20;
        const activities = await ActivityApi.list({
          limit,
          offset: state.page * limit,
          viewer: userStore.address
        });
        state.activities.push(...activities);
        state.hasMore = activities.length === limit;
        if (state.page === 0 && activities.length > 0) {
          store('lastReadActivityId', activities[0].id);
        }
      } catch (err) {
        console.log(err);
      }
      state.fetched = true;
      state.loading = false;
    })();
  }, [state.page]);

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

  return (
    <Fade in={true} timeout={350}>  
      <div className="h-screen overflow-x-auto" ref={rootRef}>
        {isPc && (
          <div className="text-gray-4a/80 dark:text-white/80 text-16 font-bold fixed top-0 left-[50%] ml-[-30px] w-[60vw] box-border pr-[30vw] pt-[2px] z-[999] h-[40px] md:h-[41px] flex items-center bg-white dark:bg-[#181818]">
            <TbActivity className="text-22 mr-2 text-orange-500" />
            {lang.activities}
          </div>
        )}
        {!state.fetched && (
          <div className="pt-[30vh] flex justify-center">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <>  
            {isMobile && (
              <div className="text-gray-4a/80 dark:text-white/90 text-18 font-bold fixed top-0 left-0 z-[999] h-[40px] md:h-[42px] flex items-center w-screen bg-white dark:bg-[#181818] border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-neutral-100 px-4">
                <TbActivity className="text-24 mr-2 text-orange-500" />
                {lang.activities}
              </div>
            )}
            <div className="w-full px-4 md:px-0 md:w-[460px] md:mx-auto pt-[56px] pb-20 md:py-[70px]">
              {state.activities.map((activity, index) => (
                <div key={activity.id}>
                  {index > 0 && state.lastReadActivityId === activity.id && (
                    <div className="w-full text-12 text-center pt-2 pb-4 dark:text-white/50 text-gray-400">
                      {lang.lastSeenHere}
                    </div>
                  )}
                  <div className="min-w-[60vw] md:min-w-[240px] inline-block py-1 px-[10px] md:px-[14px] rounded-12 text-gray-4a bg-white dark:bg-slate-400/10 dark:text-white/80 mb-[14px] cursor-pointer border border-gray-88/20 dark:border-gray-88/5" onClick={() => {
                    history.push(activity.url);
                  }}>
                    <div className="flex items-center relative py-[4px]">
                      <img src={activity.extra.userProfile.avatar} alt="avatar" className="w-[42px] h-[42px] rounded-full flex-shrink-0" />
                      <div className="flex-1 ml-2 md:ml-3 leading-1 flex-wrap pt-[3px]">
                        <div className="truncate max-w-[70vw] md:max-w-[372px] text-[14px]">
                          {activity.content === 'Image' ? lang.image : activity.content}
                        </div>
                        <div className="mt-[2px] opacity-50 flex items-center justify-between text-[12px]">
                          <div className="flex">
                            <div className="truncate max-w-[100px] mr-1">{activity.extra.userProfile.name}</div>
                            {activity.type === 'post' && lang.publishedPost}
                            {activity.type === 'comment' && lang.publishedComment}
                          </div>
                          <div className="pl-8 text-[10px] opacity-80">{ago(new Date(activity.timestamp).getTime(), {
                            trimmed: true,
                            disabledText: true,
                          })}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {state.loading && (
                <div className="pt-3 pb-5">
                  <Loading />
                </div>
              )}
              {state.activities.length === 0 && (
                <div className="py-28 text-center text-14 dark:text-white dark:text-opacity-80 text-gray-400 opacity-80">
                  {lang.empty}
                </div>
              )}
            </div>
          </>
        )}
        <div ref={sentryRef} />
      </div>
    </Fade>
  )
})
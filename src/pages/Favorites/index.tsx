import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FavoriteApi } from 'apis';
import Loading from 'components/Loading';
import { lang } from 'utils/lang';
import { AiOutlineStar } from 'react-icons/ai';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import { runInAction } from 'mobx';
import PostItem from 'components/Post/Item';
import classNames from 'classnames';

export default observer(() => {
  const { userStore, postStore } = useStore();
  const state = useLocalObservable(() => ({
    fetched: false,
    loading: true,
    page: 0,
    hasMore: true,
    invisibleOverlay: false,
  }));

  React.useEffect(() => {
    document.title = lang.favorites;
  }, []);

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      try {
        const limit = 15;
        const favorites = await FavoriteApi.list({
          limit,
          offset: state.page * limit,
          viewer: userStore.address
        });
        state.hasMore = favorites.length === limit;
        const posts = favorites.filter(f => !!f.extra?.object).map(f => f.extra!.object);
        postStore.addFavoritedPosts(posts);
        const showImageSmoothly = !state.fetched && postStore.favoritedIds.slice(0, 5).some((id) => (postStore.map[id].images || []).length > 0);
          if (showImageSmoothly) {
            runInAction(() => {
              state.invisibleOverlay = true;
            });
            setTimeout(() => {
              runInAction(() => {
                state.invisibleOverlay = false;
              });
            }, 100);
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
        <div className="text-gray-4a/80 dark:text-white/80 text-16 font-bold fixed top-0 left-[50%] ml-[-30px] w-[60vw] box-border pr-[30vw] pt-[2px] z-[9999] h-[40px] md:h-[41px] flex items-center bg-white dark:bg-[#181818]">
          <AiOutlineStar className="text-22 mr-2 text-orange-500" />
          {lang.favorites}
        </div>
        {!state.fetched && (
          <div className="pt-[30vh] flex justify-center">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <>
            <div className="w-full md:w-[600px] md:mx-auto pt-[40px] md:pt-[56px] pb-20 md:py-[70px]">
              <div className={classNames({
                'opacity-0': state.invisibleOverlay || postStore.favoritedTotal === 0
              }, "md:mt-1 w-full box-border dark:md:border-t dark:md:border-l dark:md:border-r dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] md:rounded-12 overflow-hidden")}>
                {postStore.favoritedPosts.map((post) => (
                  <div key={post.id}>
                    <PostItem
                      post={post}
                      where="postList"
                      withBorder
                    />
                  </div>
                ))}
              </div>
              {state.loading && (
                <div className="pt-8 pb-5">
                  <Loading />
                </div>
              )}
              {postStore.favoritedTotal === 0 && (
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
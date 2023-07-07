import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { CommentApi } from 'apis';
import Loading from 'components/Loading';
import { lang } from 'utils/lang';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { useStore } from 'store';
import CommentItem from 'components/Comment/Item';
import MobileCommentItem from 'components/Comment/Mobile/Item';
import { isMobile } from 'utils/env';
import classNames from 'classnames';
import { IComment } from 'apis/types';
import { FaRegComment } from 'react-icons/fa';
import openLoginModal from 'components/Wallet/openLoginModal';

export default observer(() => {
  const { userStore } = useStore();
  const state = useLocalObservable(() => ({
    comments: [] as IComment[],
    fetched: false,
    loading: true,
    page: 0,
    hasMore: true,
  }));

  React.useEffect(() => {
    document.title = lang.myComments;
  }, []);

  React.useEffect(() => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    (async () => {
      state.loading = true;
      try {
        const limit = 15;
        const comments = await CommentApi.listMy(userStore.address, {
          limit,
          offset: state.page * limit
        });
        state.hasMore = comments.length === limit;
        state.comments.push(...comments);
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
    <div className="h-screen overflow-x-auto" ref={rootRef}>
      <div className="text-gray-4a/80 dark:text-white/80 text-16 font-bold fixed top-0 left-[50%] ml-[-42px] w-[60vw] box-border pr-[30vw] pt-[2px] z-[999] h-[39px] md:h-[41px] flex items-center bg-white dark:bg-[#181818]">
        <FaRegComment className="text-18 mr-2 text-orange-500" />
        {lang.myComments}
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
              'opacity-0': state.comments.length === 0,
            }, "md:mt-1 w-full box-border dark:md:border dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] md:rounded-12 overflow-hidden md:px-5 md:pb-2")}>
              {state.comments.map((comment) => (
                <div key={comment.id}>
                  {!isMobile && (
                    <CommentItem
                      comment={comment}
                      postUserAddress={userStore.address}
                      isTopComment
                      where='myComments'
                      submit={() => { }}
                    />
                  )}
                  {isMobile && (
                    <MobileCommentItem
                      replyTo={() => {}}
                      comment={comment}
                      noSubComments
                      isTopComment
                    />
                  )}
                </div>
              ))}
            </div>
            {state.loading && (
              <div className="pt-8 pb-5">
                <Loading />
              </div>
            )}
            {state.comments.length === 0 && (
              <div className="pt-[28vh] text-center text-14 dark:text-white dark:text-opacity-80 text-gray-400 opacity-80">
                {lang.empty}
              </div>
            )}
          </div>
        </>
      )}
      <div ref={sentryRef} />
    </div>
  )
})
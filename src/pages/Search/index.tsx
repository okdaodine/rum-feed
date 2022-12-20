import React from 'react';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { IProfile } from 'apis/types';
import PostItem from 'components/Post/Item';
import { PostApi } from 'apis';
import { useStore } from 'store';
import classNames from 'classnames';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Loading from 'components/Loading';
import Query from 'utils/query';
import { TextField } from '@material-ui/core';
import { FiFilter } from 'react-icons/fi';
import openSearchModal from 'components/openSearchModal';
import qs from 'query-string';
import sleep from 'utils/sleep';
import { useHistory } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';
import { isPc, isMobile } from 'utils/env';
import { useAliveController } from 'react-activation';
import TopPlaceHolder from 'components/TopPlaceHolder';

import './index.css';

export default observer(() => {
  const { userStore, postStore, pathStore } = useStore();
  const total = postStore.searchedPosts.length;
  const history = useHistory();
  const aliveController = useAliveController();
  (window as any).aliveController = aliveController;
  const state = useLocalObservable(() => ({
    q: Query.get('q') || '',
    minLike: Query.get('minLike') || '',
    minComment: Query.get('minComment') || '',
    profileMap: {} as Record<string, IProfile>,
    invisibleOverlay: false,
    fetching: false,
    fetched: false,
    hasMore: false,
    page: 1,
    searched: false,
    get myProfile () {
      return this.profileMap[userStore.address]
    },
    get isEmptyInput() {
      return !this.q && !this.minLike && !this.minComment
    }
  }));

  React.useEffect(() => {
    fetchData();
  }, [state.page]);

  React.useEffect(() => {
    let mounted = true;
    history.listen(() => {
      if (mounted) {
        const isSearchPage = window.location.pathname === '/search';
        let changed = false;
        if (isSearchPage) {
          if (state.q !== Query.get('q')) {
            state.q = Query.get('q') || '';
            changed = true;
          }
          if (state.minLike !== Query.get('minLike')) {
            state.minLike = Query.get('minLike') || '';
            changed = true;
          }
          if (state.minComment !== Query.get('minComment')) {
            state.minComment = Query.get('minComment') || '';
            changed = true;
          }
          if (changed) {
            postStore.resetSearchedTrxIds();
            state.fetched = false;
            state.page = 1;
            fetchData();
          }
        }
      }
    });
    return () => {
      mounted = false;
    }
  }, []);

  const fetchData = async () => {
    if (state.fetching) {
      return;
    }
    if (!state.searched && state.isEmptyInput) {
      return;
    }
    state.fetching = true;
    try {
      const limit = isMobile ? 10 : 15;
      const posts = await PostApi.list({
        q: state.q,
        minLike: state.minLike,
        minComment: state.minComment,
        viewer: userStore.address,
        offset: (state.page - 1) * limit,
        limit
      });
      postStore.addSearchedPosts(posts);
      state.hasMore = posts.length === limit;
      const showImageSmoothly = !state.fetched && postStore.searchedTrxIds.slice(0, 5).some((trxId) => (postStore.map[trxId].images || []).length > 0);
        if (showImageSmoothly) {
          runInAction(() => {
            state.invisibleOverlay = true;
          });
          setTimeout(() => {
            runInAction(() => {
              state.invisibleOverlay = false;
            });
          });
        }
    } catch (err) {
      console.log(err);
    }
    state.fetching = false;
    state.fetched = true;
    state.searched = true;
  }

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.fetching,
    hasNextPage: state.hasMore,
    rootMargin: '0px 0px 300px 0px',
    onLoadMore: async () => {
      state.page += 1;
    },
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      submit();
    }
  }

  const submit = () => {
    postStore.resetSearchedTrxIds();
    state.fetched = false;
    state.page = 1;
    history.replace(`/search?${qs.stringify({
      q: state.q,
      minLike: state.minLike,
      minComment: state.minComment,
    }, {
      skipEmptyString: true
    })}`);
    fetchData();
  }

  return (
    <div className="w-full h-screen overflow-auto" ref={rootRef}>
      <TopPlaceHolder />
      <div className="w-full md:w-[600px] box-border mx-auto relative">
        <div className="pt-[15px] md:pt-[38px] pb-12 md:pb-4">
          <div className="fixed top-0 left-0 md:left-[50%] md:ml-[-300px] z-[100] w-full md:w-[600px]">
            <div className="bg-white dark:bg-[#181818] flex justify-center items-center px-2 pt-1 md:pt-3 pb-2 md:pb-4 md:border-b dark:md:border dark:md:border-white dark:md:border-opacity-10  md:border-gray-ec md:rounded-12 shadow-sm">
              <div className="flex items-center text-30 ml-1 mr-3 dark:text-white dark:text-opacity-80 text-gray-88 mt-1 cursor-pointer" onClick={async () => {
                pathStore.paths.length > 0 ? history.goBack() : history.replace(`/`);
                await aliveController.drop('search');
                postStore.resetSearchedTrxIds();
              }}>
                <MdChevronLeft />
                {isPc && <span className="text-14 mr-5">返回</span>}
              </div>
              <form action="/" className="flex-1 md:flex-initial md:w-64">
                <TextField
                  className="top-search-input"
                  fullWidth
                  autoFocus
                  placeholder='输入关键词'
                  value={state.q}
                  onChange={(e) => {
                    state.q = e.target.value.trim();
                  }}
                  onKeyDown={onKeyDown}
                  variant="outlined"
                  margin="dense"
                />
              </form>
              <div className={classNames({
                'text-orange-500': state.minLike || state.minComment,
                'dark:text-white dark:text-opacity-80 text-gray-88': !(state.minLike || state.minComment),
              }, "ml-4 flex items-center cursor-pointer mt-1 mr-1 md:mr-0")}
              onClick={async () => {
                const result = await openSearchModal({
                  q: state.q,
                  minLike: state.minLike,
                  minComment: state.minComment,
                });
                if (result) {
                  await sleep(300);
                  state.q = result.q || '';
                  state.minLike = result.minLike || '';
                  state.minComment = result.minComment || '';
                  submit();
                }
              }}>
                筛选
                <FiFilter className="text-14 ml-1" />
              </div>
            </div>
          </div>
          <div className={classNames({
            'opacity-0': state.invisibleOverlay || !state.fetched || total === 0
          }, "md:mt-2 w-full box-border dark:md:border-t dark:md:border-l dark:md:border-r dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] md:rounded-12 overflow-hidden")}>
            {postStore.searchedPosts.map((post) => (
              <div key={post.trxId}>
                <PostItem
                  post={post}
                  where="postList"
                  withBorder
                />
              </div>
            ))}
          </div>
          {!state.fetched && state.fetching && (
            <div className="pt-[30vh]">
              <Loading />
            </div>
          )}
          {state.fetched && state.fetching && (
            <div className="pt-6 md:pt-3 pb-12 md:pb-5">
              <Loading />
            </div>
          )}
          {state.fetched && total === 0 && (
            <div className="pt-[20vh] text-center dark:text-white dark:text-opacity-80 text-gray-500 text-14 leading-10 opacity-70">
              没有搜索到相关内容<br /> 换一个关键词试试呢？
            </div>
          )}
        </div>
      </div>
      <div ref={sentryRef} />
    </div>
  )
});


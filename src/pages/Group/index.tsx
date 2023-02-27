import React from 'react';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { IPost, IProfile, IGroup } from 'apis/types';
import { TrxStorage } from 'apis/common';
import PostItem from 'components/Post/Item';
import { PostApi, TrxApi } from 'apis';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import { useStore } from 'store';
import classNames from 'classnames';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Loading from 'components/Loading';
import openLoginModal from 'components/Wallet/openLoginModal';
import Button from 'components/Button';
import { isMobile } from 'utils/env';
import TopPlaceHolder, { scrollToTop } from 'components/TopPlaceHolder';
import { RouteChildrenProps } from 'react-router-dom';
import { useActivate, useUnactivate } from 'react-activation';
import sleep from 'utils/sleep';
import { IActivity } from 'rum-sdk-browser';
import { v4 as uuid } from 'uuid';
import base64 from 'utils/base64';

import './index.css';

export default observer((props: RouteChildrenProps) => {
  const { userStore, postStore, groupStore } = useStore();
  const groupName = (props.match?.params as { groupName: string }).groupName.toLowerCase();
  const state = useLocalObservable(() => ({
    content: '',
    profileMap: {} as Record<string, IProfile>,
    invisibleOverlay: false,
    fetchingPosts: false,
    fetchedPosts: false,
    fetchedGroup: false,
    hasMore: false,
    page: 1,
    group: null as IGroup | null,
    invisible: false,
    get myProfile () {
      return this.profileMap[userStore.address]
    },
    get fetched() {
      return this.fetchedGroup && this.fetchedPosts
    },
  }));
  const DEFAULT_BG_GRADIENT = '/default_cover.png';

  useActivate(() => {
    if (state.fetched) {
      (async () => {
        await sleep(200);
        state.invisible = false;
        if (state.fetchedGroup && state.group) {
          document.title = state.group.groupAlias;
        }
      })();
    }
  });

  useUnactivate(() => {
    state.invisible = true;
  });

  React.useEffect(() => {
    postStore.resetGroupIds();
    const fetched = state.fetched;
    if (fetched) {
      state.fetchedPosts = false;
      state.fetchingPosts = true;
      state.page = 1;
      state.fetchedGroup = false;
    }
    (async () => {
      try {
        const group = groupStore.nameMap[groupName];
        if (!group) {
          throw new Error('group not found');
        }
        await fetchPosts(group.groupId);
        state.group = group;
        document.title = group.groupAlias;
      } catch (err) {
        console.log(err);
      }
      state.fetchedGroup = true;
      if (fetched) {
        await sleep(200);
        scrollToTop();
        state.invisible = false;
      }
    })();
  }, [groupName]);

  const fetchPosts = async (groupId: string) => {
    state.fetchingPosts = true;
    try {
      const limit = 15;
      const posts = await PostApi.list({
        groupId: groupId || '',
        type: 'latest',
        viewer: userStore.address,
        offset: (state.page - 1) * limit,
        limit,
      });
      postStore.addGroupPosts(posts);
      state.hasMore = posts.length === limit;
      const showImageSmoothly = !state.fetchedPosts && postStore.ids.slice(0, 5).some((id) => (postStore.map[id].images || []).length > 0);
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
    state.fetchingPosts = false;
    state.fetchedPosts = true;
  }

  React.useEffect(() => {
    if (!state.fetchedPosts) {
      return;
    }
    if (state.fetchingPosts) {
      return;
    }
    if (state.group) {
      fetchPosts(state.group.groupId);
    }
  }, [state.page]);

  React.useEffect(() => {
    if (state.fetchedPosts) {
      state.fetchedPosts = false;
      state.fetchingPosts = true;
      state.page = 1;
      postStore.resetIds();
      if (state.group) {
        fetchPosts(state.group.groupId);
      }
    }
  }, [postStore.feedType])

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.fetchingPosts,
    hasNextPage: state.hasMore,
    rootMargin: '0px 0px 300px 0px',
    onLoadMore: async () => {
      state.page += 1;
    },
  });

  const submitPost = async (activity: IActivity) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    const res = await TrxApi.createActivity(activity, state.group!.groupId);
    console.log(res);
    const post: IPost = {
      content: activity.object?.content || '',
      images: activity.object?.image?.map(image => base64.getUrl(image as any)) ?? [],
      userAddress: userStore.address,
      groupId: state.group!.groupId,
      trxId: res.trx_id,
      id: activity.object?.id ?? '',
      latestTrxId: '',
      storage: TrxStorage.cache,
      commentCount: 0,
      likeCount: 0,
      imageCount: (activity.object?.image || []).length,
      timestamp: Date.now(),
      extra: {
        userProfile: userStore.profile,
        groupName: state.group!.groupName
      }
    };
    postStore.addGroupPost(post);
    postStore.addPost(post);
    userStore.updateUser(userStore.address, {
      postCount: userStore.user.postCount + 1
    });
    state.content = '';
  }

  return (
    <div className="box-border w-full h-screen overflow-auto bg-white dark:bg-[#181818] md:bg-transparent posts-page" ref={rootRef}>
      <TopPlaceHolder />
      {!state.fetched && (
        <div className="py-[30vh] flex justify-center">
          <Loading />
        </div>
      )}
      {state.fetched && (
        <div className={classNames({
          'invisible': state.invisible
        }, "w-full md:w-[600px] box-border mx-auto relative pb-16")}>
          {!state.group && <div className="py-32 text-center dark:text-white dark:text-opacity-80 text-gray-500 text-14">空空如也 ~</div>}
          {state.group && (
            <div>
              <div className="flex items-stretch overflow-hidden relative p-6 pb-5 md:pb-6 px-5 md:px-8 md:rounded-12 md:mt-5">
                <div
                  className="absolute top-0 left-0 w-full h-full overflow-hidden bg-cover bg-center md:rounded-12"
                  style={{
                    backgroundImage: `url('${DEFAULT_BG_GRADIENT}')`,
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 bottom-0 blur-layer md:rounded-12" />
                </div>
                <div className="z-10 font-bold text-center text-22 md:text-26 text-white w-full py-4 tracking-wider">
                  {state.group.groupAlias}
                </div>
              </div>
              <div className="md:pt-5">
                <div className="hidden md:block">
                  <Editor
                    groupId={state.group.groupId}
                    editorKey="post"
                    placeholder={lang.whatsHappening}
                    autoFocusDisabled
                    minRows={3}
                    submit={(data) => {
                      const payload: IActivity = {
                        type: 'Create',
                        object: {
                          type: 'Note',
                          id: uuid(),
                          content: data.content,
                          ...data.images ? {
                            image: data.images.map(v => ({
                              type: 'Image',
                              mediaType: v.mediaType,
                              content: v.content,
                            }))
                          } : {}
                        }
                      };
                      return submitPost(payload);
                    }}
                    enabledImage
                  />
                </div>
                <div className={classNames({
                  'opacity-0': state.invisibleOverlay || !state.fetched || postStore.groupTotal === 0
                }, "md:mt-5 w-full box-border dark:md:border-t dark:md:border-l dark:md:border-r dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] md:rounded-12")}>
                  {postStore.groupPosts.map((post) => (
                    <div key={post.id}>
                      <PostItem
                        post={post}
                        where="postList"
                        withBorder
                      />
                    </div>
                  ))}
                </div>
                {!state.fetchedPosts && state.fetchingPosts && (
                  <div className="pt-[30vh]">
                    <Loading />
                  </div>
                )}
                {state.fetchedPosts && state.fetchingPosts && (
                  <div className="pt-6 md:pt-3 pb-12 md:pb-5">
                    <Loading />
                  </div>
                )}
                {state.fetchedPosts && postStore.groupTotal === 0 && (
                  <div className="py-[30vh] text-center dark:text-white dark:text-opacity-80 text-gray-500 text-14 tracking-wider opacity-80">
                    {['latest', 'random'].includes(postStore.feedType) && lang.letUsPostSomething}
                    {postStore.feedType === 'following' && lang.followPeopleYouAreInterestedIn}
                    {postStore.feedType === 'latest' && isMobile && !userStore.isLogin && (
                      <div className="flex justify-center mt-5">
                        <Button onClick={openLoginModal} >
                          {lang.publish}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div ref={sentryRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
});

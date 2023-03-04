import React from 'react';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { IPost, IProfile } from 'apis/types';
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
import { IActivity } from 'rum-sdk-browser';
import Button from 'components/Button';
import { isMobile } from 'utils/env';
import TopPlaceHolder from 'components/TopPlaceHolder';
import { v4 as uuid } from 'uuid';
import base64 from 'utils/base64';
import GroupsModal from './GroupsModal';

export default observer(() => {
  const { userStore, postStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    content: '',
    invisibleOverlay: false,
    fetching: false,
    fetched: false,
    hasMore: false,
    page: 1,
    showGroupsModal: false,
  }));

  const fetchData = async () => {
    state.fetching = true;
    try {
      const limit = isMobile ? 10 : 15;
      const posts = await PostApi.list({
        type: postStore.feedType,
        viewer: userStore.address,
        offset: (state.page - 1) * limit,
        limit,
      });
      postStore.addPosts(posts);
      state.hasMore = posts.length === limit;
      const showImageSmoothly = !state.fetched && postStore.ids.slice(0, 5).some((id) => (postStore.map[id].images || []).length > 0);
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
    state.fetching = false;
    state.fetched = true;
  }

  React.useEffect(() => {
    if (state.fetching) {
      return;
    }
    fetchData();
  }, [state.page]);

  React.useEffect(() => {
    if (state.fetched) {
      state.fetched = false;
      state.fetching = true;
      state.page = 1;
      postStore.resetIds();
      fetchData();
    }
  }, [postStore.feedType])

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.fetching,
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
    const res = await TrxApi.createActivity(activity, groupStore.defaultGroup.groupId);
    console.log(res);
    const post: IPost = {
      content: activity.object?.content || '',
      images: activity.object?.image?.map(image => base64.getUrl(image as any)) ?? [],
      userAddress: userStore.address,
      groupId: groupStore.defaultGroup.groupId,
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
        groupName: groupStore.defaultGroup.groupName
      }
    };
    postStore.addPost(post);
    userStore.updateUser(userStore.address, {
      postCount: userStore.user.postCount + 1
    });
    state.content = '';
  }

  return (
    <div className="box-border w-full h-screen overflow-auto bg-white dark:bg-[#181818] md:bg-transparent" ref={rootRef}>
      <TopPlaceHolder />
      <div className="w-full md:w-[600px] box-border mx-auto relative pb-16">
        <div className="md:pt-5">
          <div className="py-3 px-5 flex justify-between items-center bg-white/30 rounded-12">
            <div className="text-18 text-white/80">Find your NFT club</div>
            <Button onClick={() => {
              state.showGroupsModal = true;
            }}>Go</Button>
            <GroupsModal
              open={state.showGroupsModal}
              onClose={() => {
                state.showGroupsModal = false;
              }}
            />
          </div>
          <div className="hidden _md:block">
            <Editor
              groupId={groupStore.defaultGroup.groupId}
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
            'opacity-0': state.invisibleOverlay || !state.fetched
          }, "md:mt-5 w-full box-border dark:md:border-t dark:md:border-l dark:md:border-r dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] md:rounded-12 overflow-hidden")}>
            {postStore.posts.map((post) => (
              <div key={post.id}>
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
          {state.fetched && postStore.total === 0 && (
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
    </div>
  )
});

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { isMobile } from 'utils/env';
import Button from 'components/Button';
import { BiEditAlt } from 'react-icons/bi';
import { useStore } from 'store';
import { ProfileApi, UserApi, PostApi } from 'apis';
import { IProfile } from 'apis/types';
import openProfileEditor from 'components/openProfileEditor';
import PostItem from 'components/Post/Item';
import classNames from 'classnames';
import { runInAction } from 'mobx';
import Loading from 'components/Loading';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import openEditor from 'components/Post/OpenEditor';
import sleep from 'utils/sleep';
import { RiMoreFill } from 'react-icons/ri';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { BsFillMicMuteFill } from 'react-icons/bs';
import { BiLogOutCircle } from 'react-icons/bi';
import UserListModal from './UserListModal';
import openLoginModal from 'components/openLoginModal';
import { TrxApi } from 'apis';
import { lang } from 'utils/lang';
import store from 'store2';
import TopPlaceHolder, { scrollToTop } from 'components/TopPlaceHolder';
import { useActivate, useUnactivate } from 'react-activation';
import { RouteChildrenProps } from 'react-router-dom';
import UserName from 'components/UserName';
import openPhotoSwipe from 'components/openPhotoSwipe';

import './index.css';

export default observer((props: RouteChildrenProps) => {
  const {
    userStore,
    groupStore,
    postStore,
    snackbarStore,
    confirmDialogStore,
    modalStore
  } = useStore();
  const state = useLocalObservable(() => ({
    profile: {} as IProfile,
    notFound: false,
    postPage: 1,
    invisible: false,
    invisibleOverlay: false,
    fetched: false,
    fetchingPosts: false,
    hasMorePosts: false,
    anchorEl: null,
    showUserListModal: false,
    submitting: false,
    userListType: 'following' as ('following' | 'followers' | 'muted'),
    userAddressChanged: false,
  }));
  const { userAddress } = props.match?.params as any;
  const { profile } = state;
  const user = userStore.userMap[userAddress]!;
  const isMyself = userStore.address === userAddress;
  const DEFAULT_BG_GRADIENT =
  'https://static-assets.pek3b.qingstor.com/rum-avatars/default_cover.png';
  const isTweet = (profile.name || '').includes('\n@');
  const fromWeibo = isTweet && (profile.name || '').includes('\n@weibo');
  const fromTwitter = isTweet && !fromWeibo;

  React.useEffect(() => {
    (async () => {
      const fetched = state.fetched;
      state.fetched = false;
      state.fetchingPosts = true;
      state.postPage = 1;
      postStore.resetUserTrxIds();
      await Promise.all([
        fetchProfile(),
        fetchPosts(),
      ]);
      if (fetched) {
        await sleep(200);
      }
      state.fetched = true;
      if (fetched) {
        await sleep(200);
        scrollToTop();
        state.invisible = false;
      }
    })();
  }, [userAddress]);
  
  useActivate(() => {
    if (state.fetched) {
      (async () => {
        await sleep(200);
        state.invisible = false;
      })();
    }
  });

  useUnactivate(() => {
    state.invisible = true;
  });

  const fetchProfile = async () => {
    try {
      if (isMyself) {
        state.profile = userStore.profile;
      } else {
        const profile = await ProfileApi.get(userAddress);
        state.profile = profile;
      }
      if (!user) {
        const user = await UserApi.get(userAddress, {
          viewer: userStore.address
        });
        userStore.setUser(userAddress, user);
      }
    } catch (err) {
      console.log(err);
      state.notFound = true;
    }
    document.title = state.profile.name;
  }

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchPosts = async () => {
    state.fetchingPosts = true;
    try {
      if (state.postPage === 1) {
        postStore.resetUserTrxIds();
      }
      const limit = 10;
      const posts = await PostApi.list({
        userAddress,
        viewer: userStore.address,
        offset: (state.postPage - 1) * limit,
        limit: limit
      });
      state.hasMorePosts = posts.length === limit;
      postStore.addUserPosts(posts);
      const showImageSmoothly = !state.fetched && postStore.userTrxIds.slice(0, 5).some((trxId) => (postStore.map[trxId].images || []).length > 0);
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
    state.fetchingPosts = false;
  }

  React.useEffect(() => {
    if (state.fetchingPosts) {
      return;
    }
    fetchPosts();
  }, [state.postPage]);

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.fetchingPosts,
    hasNextPage: state.hasMorePosts,
    rootMargin: '0px 0px 300px 0px',
    onLoadMore: async () => {
      state.postPage += 1;
    },
  });


  React.useEffect(() => {
    if (isMyself) {
      state.profile = userStore.profile;
    }
  }, [userStore.profile]);

  const changeRelation = async (type: 'follow' | 'unfollow' | 'mute' | 'unmute') => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    try {
      const res = await TrxApi.createObject({
        groupId: groupStore.relationGroup.groupId,
        object: {
          type: 'Note',
          content: JSON.stringify({
            groupId: groupStore.defaultGroup.groupId,
            type,
            to: userAddress
          })
        },
      });
      console.log(res);
      if (type.includes('follow')) {
        userStore.updateUser(userAddress, {
          followerCount: user.followerCount + (type === 'follow' ? 1 : -1),
          following: !user.following
        });
        userStore.updateUser(userStore.address, {
          followingCount: userStore.user.followingCount + (type === 'follow' ? 1 : -1),
        });
      }
      if (type.includes('mute')) {
        user.muted = !user.muted;
      }
      if (type === 'mute') {
        postStore.removePostByUser(userAddress);
      }
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.submitting = false;
  }

  if (!state.fetched || !user) {
    return (
      <div className="pt-[30vh] flex justify-center">
        <Loading />
      </div>
    )
  }

  if (state.fetched && state.notFound) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-20 text-base md:text-xl text-center dark:text-white dark:text-opacity-80 text-gray-600">
          抱歉，你访问的用户不存在
        </div>
      </div>
    );
  }

  return (
    <div className="box-border w-full h-screen overflow-auto user-page bg-white dark:bg-[#181818] md:bg-transparent pb-16" ref={rootRef}>
      <TopPlaceHolder />
      <div className={classNames({
        'invisible': state.invisible
      }, "w-full md:w-[600px] box-border mx-auto md:pt-5")}>
        <div>
          <div className="flex items-stretch overflow-hidden relative p-6 pb-5 md:pb-6 px-5 md:px-8 md:rounded-12">
            <div
              className="absolute top-0 left-0 w-full h-full overflow-hidden bg-cover bg-center md:rounded-12"
              style={{
                backgroundImage: `url('${DEFAULT_BG_GRADIENT}')`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 blur-layer md:rounded-12" />
            </div>
            <div className="justify-between z-10 w-full box-border pt-2 px-5 md:px-8 text-white dark:text-white dark:text-opacity-90 relative">
              <div>
                <img
                  onClick={() => {
                    openPhotoSwipe({
                      image: profile.avatar,
                    });
                  }}
                  width={isMobile ? 74 : 100}
                  height={isMobile ? 74 : 100}
                  className="rounded-full avatar bg-white dark:bg-[#181818]"
                  src={profile.avatar}
                  alt={profile.name}
                />
                <div className="mt-2 pt-1 text-19 md:text-24">
                  <UserName
                    name={profile.name}
                    normalNameClass="leading-snug font-bold w-[230px] md:w-[320px] break-words"
                    fromClass='mt-[2px]'
                    fromNameClass="py-1 truncate font-bold max-w-[70vw] md:max-w-[350px]"
                    fromIconClass="text-28 mx-1"
                    fromIdClass="hidden"
                    />
                </div>
                <div className="text-14 md:text-16 flex items-center pt-1 md:pt-0">
                  <span className="mt-2">
                    {' '}
                    <span className="text-16 font-bold">
                      {user.postCount}
                    </span> 条内容{' '}
                  </span>
                  <span className="mx-3 mt-[10px] opacity-50">|</span>
                  <span
                    className="cursor-pointer mt-2"
                    onClick={() => {
                      if (user.followingCount > 0) {
                        state.userListType = 'following';
                        state.showUserListModal = true;
                      }
                    }}
                  >
                    <span className="text-16 font-bold">
                      {user.followingCount}
                    </span>{' '}
                    关注{' '}
                  </span>
                  <span className="opacity-50 mx-3 mt-[10px]">|</span>
                  <span
                    className="cursor-pointer mt-2"
                    onClick={() => {
                      if (user.followerCount > 0) {
                        state.userListType = 'followers';
                        state.showUserListModal = true;
                      }
                    }}
                  >
                    <span className="text-16 font-bold">{user.followerCount}</span>{' '}
                    被关注
                  </span>
                </div>
                {fromTwitter && (
                  <div className="text-black bg-white dark:bg-opacity-90 py-1 px-3 rounded-full w-full text-12 mt-4 text-center tracking-wider">
                    本号所有内容来自推特用户 @{profile.name.split('\n@')[1]}
                  </div>
                )}
                {fromWeibo && (
                  <div className="text-black bg-white dark:bg-opacity-90 py-1 px-3 rounded-full w-full text-12 mt-4 text-center tracking-wider">
                    本号所有内容来自微博用户 @{profile.name.split('\n@')[0]}
                  </div>
                )}
              </div>
              <div className="mt-5 md:mt-12 pt-4 mr-3 md:mr-5 absolute top-0 right-0">
                <div className="flex items-center">
                  {!user.muted && (
                    <div
                      className="mr-5 md:mr-6 h-8 w-8 rounded-full border border-white flex items-center justify-center opacity-60 md:opacity-80"
                      onClick={(e: any) => {
                        state.anchorEl = e.currentTarget
                      }}>
                      <RiMoreFill className="text-20 text-white cursor-pointer" />
                    </div>
                  )}
                  {(isMyself || !user.muted) && (
                    <Menu
                      anchorEl={state.anchorEl}
                      getContentAnchorEl={null}
                      open={Boolean(state.anchorEl)}
                      onClose={() => {
                        state.anchorEl = null;
                      }}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                      {isMyself && (
                        <MenuItem onClick={() => {
                          state.anchorEl = null;
                          state.userListType = 'muted';
                          state.showUserListModal = true;
                        }}>  
                          <div className="py-1 pl-1 pr-3 flex items-center dark:text-white dark:text-opacity-80 text-neutral-700">
                            <BsFillMicMuteFill className="mr-2 text-16" /> 屏蔽列表
                          </div>
                        </MenuItem>
                      )}
                      {isMyself && (
                        <MenuItem onClick={() => {
                          state.anchorEl = null;
                          confirmDialogStore.show({
                            content: '确定退出帐号吗？',
                            ok: async () => {
                              confirmDialogStore.hide();
                              await sleep(400);
                              store.clear();
                              modalStore.pageLoading.show();
                              window.location.href = `/`;
                            },
                          });
                        }}>  
                          <div className="py-1 pl-1 pr-3 flex items-center text-red-400">
                            <BiLogOutCircle className="mr-2 text-16" /> 退出帐号
                          </div>
                        </MenuItem>
                      )}
                      {!isMyself && (
                        <MenuItem onClick={() => {
                          state.anchorEl = null;
                          confirmDialogStore.show({
                            content: `确定屏蔽吗？`,
                            ok: async () => {
                              confirmDialogStore.setLoading(true);
                              await changeRelation('mute');
                              confirmDialogStore.hide();
                            },
                          });
                        }}>
                          <div className="py-1 pl-3 pr-4 flex items-center text-red-400">
                            <BsFillMicMuteFill className="mr-2 text-16" /> 屏蔽
                          </div>
                        </MenuItem>
                      )}
                    </Menu>
                  )}
                  {!isMyself && !user.muted && (
                    <div>
                      {user.following ? (
                        <Button
                          isDoing={state.submitting && !confirmDialogStore.open}
                          color="white"
                          outline
                          onClick={() => changeRelation('unfollow')}>
                          已关注
                        </Button>
                      ) : (
                        <Button
                          isDoing={state.submitting && !confirmDialogStore.open}
                          color='white'
                          onClick={() => changeRelation('follow')}>
                          关注
                        </Button>
                      )}
                    </div>
                  )}
                  {isMyself && (
                    <Button
                      outline
                      color="white"
                      size={isMobile ? 'small' : 'normal'}
                      onClick={openProfileEditor}
                    >
                      <div className="flex items-center text-16 mr-1">
                        <BiEditAlt />
                      </div>
                      {isMobile ? '编辑' : '编辑资料'}
                    </Button>
                  )}
                  {!isMyself && user.muted && (
                    <Button
                      color='red'
                      onClick={() => changeRelation('unmute')}>
                        已屏蔽
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className={classNames({
            'opacity-0': state.invisibleOverlay|| !state.fetched || user.postCount === 0
          }, "md:mt-5 w-full box-border dark:md:border-t dark:md:border-l dark:md:border-r dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] md:rounded-12 overflow-hidden")}>
            {postStore.userPosts.map((post) => (
              <div key={post.trxId}>
                <PostItem
                  post={post}
                  where="postList"
                  withBorder
                  disabledUserCardTooltip
                />
              </div>
            ))}
          </div>
          {isMyself && state.fetched && !state.fetchingPosts && user.postCount === 0 && (
            <div className="flex justify-center py-16">
              <Button
                outline
                onClick={async () => {
                  const post = await openEditor();
                  if (post) {
                    await sleep(400);
                    scrollToTop();
                    await sleep(200);
                    postStore.addUserPost(post);
                    if (postStore.feedType === 'latest') {
                      postStore.addPost(post);
                    }
                    userStore.updateUser(userAddress, {
                      postCount: user.postCount + 1
                    });
                  }
                }}
              >
                点击发布第一条内容
              </Button>
            </div>
          )}
          {!isMyself && state.fetched && user.postCount === 0 && (
            <div className="py-32 text-center dark:text-white dark:text-opacity-80 text-gray-500 text-14">
              还没有发布过内容
            </div>
          )}
          {state.fetched && state.fetchingPosts && (
            <div className="pt-6 md:pt-3 pb-12 md:pb-5">
              <Loading />
            </div>
          )}
        </div>
      </div>
      <UserListModal
        userAddress={userAddress}
        type={state.userListType}
        open={state.showUserListModal}
        onClose={() => {
          state.showUserListModal = false;
        }} />
      <div ref={sentryRef} />
    </div>
  )
})
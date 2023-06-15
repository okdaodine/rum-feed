import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { isMobile } from 'utils/env';
import Button from 'components/Button';
import { BiEditAlt } from 'react-icons/bi';
import { useStore } from 'store';
import { ProfileApi, UserApi, PostApi, ContentApi } from 'apis';
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
import { BiLogOutCircle, BiExport } from 'react-icons/bi';
import { MdOutlineMail } from 'react-icons/md';
import { MdLanguage } from 'react-icons/md';
import UserListModal from './UserListModal';
import openLoginModal from 'components/Wallet/openLoginModal';
import { TrxApi } from 'apis';
import { lang } from 'utils/lang';
import TopPlaceHolder, { scrollToTop } from 'components/TopPlaceHolder';
import { useActivate, useUnactivate } from 'react-activation';
import { RouteChildrenProps } from 'react-router-dom';
import UserName from 'components/UserName';
import openPhotoSwipe from 'components/openPhotoSwipe';
import { RiKey2Fill } from 'react-icons/ri';
import openWalletModal from 'components/Wallet/openWalletModal';
import MutedContent from 'components/MutedContent';
import openLanguageModal from 'components/openLanguageModal';
import openChatModal from 'components/openChatModal';

import './index.css';

export default observer((props: RouteChildrenProps) => {
  const {
    userStore,
    groupStore,
    postStore,
    snackbarStore,
    confirmDialogStore,
    modalStore,
    relationStore,
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
    exporting: false,
  }));
  const { userAddress } = props.match?.params as any;
  const { profile } = state;
  const user = userStore.userMap[userAddress]!;
  const isMyself = userStore.address === userAddress;
  const DEFAULT_BG_GRADIENT = '/default_cover.png';
  const isTweet = (profile.name || '').includes('\n@');
  const fromWeibo = isTweet && (profile.name || '').includes('\n@weibo');
  const fromTwitter = isTweet && !fromWeibo;

  React.useEffect(() => {
    (async () => {
      const fetched = state.fetched;
      state.fetched = false;
      state.fetchingPosts = true;
      state.postPage = 1;
      postStore.resetUserIds();
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
      if (!user || (!isMyself && !user.pubKey)) {
        const user = await UserApi.get(userAddress, {
          viewer: userStore.address,
        });
        userStore.setUser(userAddress, user);
      }
    } catch (err) {
      console.log(err);
      state.notFound = true;
    }
    document.title = state.profile.name;
  }

  const fetchPosts = async () => {
    state.fetchingPosts = true;
    try {
      if (state.postPage === 1) {
        postStore.resetUserIds();
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
      const showImageSmoothly = !state.fetched && postStore.userIds.slice(0, 5).some((id) => (postStore.map[id].images || []).length > 0);
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
      if (['follow', 'unfollow'].includes(type)) {
        const follow = {
          type: 'Follow',
          object: {
            type: 'Person',
            id: userAddress,
          },
        };
        type === 'follow' ?
          await TrxApi.createActivity(follow, groupStore.relationGroup.groupId) : 
          await TrxApi.createActivity({ type: 'Undo', object: follow }, groupStore.relationGroup.groupId);
      }
      if (['mute', 'unmute'].includes(type)) {
        const block = {
          type: 'Block',
          object: {
            type: 'Person',
            id: userAddress,
          },
        }
        type === 'mute' ?
          await TrxApi.createActivity(block, groupStore.relationGroup.groupId) :
          await TrxApi.createActivity({ type: 'Undo', object: block }, groupStore.relationGroup.groupId);
      }
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

  const exportData = async () => {
    try {
      if (state.exporting) {
        return;
      }
      if (isMobile) {
        confirmDialogStore.show({
          content: lang.pleaseExportDataOnDesktop,
          ok: () => {
            confirmDialogStore.hide();
          },
        });
        return; 
      }
      state.exporting = true;
      const exportedContents = [];
      const limit = 50;
      while (true) {
        const contents: any = await ContentApi.export(userStore.pubKey, {
          offset: exportedContents.length,
          limit,
        });
        exportedContents.push(...contents);
        await sleep(500);
        if (contents.length < limit) {
          break;
        }
      }
      confirmDialogStore.show({
        content: `<a id="download-export-data" href='data:plain/text,${JSON.stringify(exportedContents)}' download='${userStore.profile.name}_${userStore.pubKey}.json'>${lang.youAreSureTo(lang.exportData)}</a>`,
        ok: () => {
          (document.querySelector('#download-export-data') as any).click();
          confirmDialogStore.hide();
        },
      });
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.exporting = false;
    state.anchorEl = null;
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
          {lang.notFound(lang.user)}
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
              className="absolute top-0 left-0 w-full h-full overflow-hidden bg-cover dark:bg-[left_33px] md:rounded-12"
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
                    {lang.follow}{' '}
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
                    {lang.followers}
                  </span>
                </div>
                {fromTwitter && (
                  <div className="text-black bg-white dark:bg-opacity-90 py-1 px-3 rounded-full w-full text-12 mt-4 text-center tracking-wider">
                    {lang.allContentsComeFromTwitterUser} @{profile.name.split('\n@')[1]}
                  </div>
                )}
                {fromWeibo && (
                  <div className="text-black bg-white dark:bg-opacity-90 py-1 px-3 rounded-full w-full text-12 mt-4 text-center tracking-wider">
                    {lang.allContentsComeFromWeiboUser} @{profile.name.split('\n@')[0]}
                  </div>
                )}
              </div>
              <div className="mt-5 md:mt-12 pt-4 md:mr-5 absolute top-0 right-0">
                <div className="flex items-center">
                  {userStore.isLogin &&!user.muted && (
                    <div
                      className="mr-3 md:mr-5 h-8 w-8 rounded-full border border-white/70 flex items-center justify-center opacity-60 md:opacity-80"
                      onClick={(e: any) => {
                        state.anchorEl = e.currentTarget
                      }}>
                      <RiMoreFill className="text-20 text-white cursor-pointer" />
                    </div>
                  )}
                  {userStore.isLogin && !user.muted && !isMyself && !fromTwitter && !fromWeibo && !relationStore.mutedMe.has(userAddress) && !!user.pubKey && (
                    <div
                      className="mr-3 md:mr-5 h-8 w-8 rounded-full border border-white/70 flex items-center justify-center opacity-60 md:opacity-80"
                      onClick={() => {
                        if (!userStore.user.pubKey) {
                          confirmDialogStore.show({
                            content: lang.needOnePostToUseDM,
                            cancelDisabled: true,
                            okText: lang.gotIt,
                            ok: async () => {
                              confirmDialogStore.hide();
                            },
                          });
                          return;
                        }
                        openChatModal({
                          toPubKey: user.pubKey,
                          toUserProfile: profile
                        });
                      }}>
                      <MdOutlineMail className="text-18 text-white cursor-pointer" />
                    </div>
                  )}
                  {userStore.isLogin &&(isMyself || !user.muted) && (
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
                            <BsFillMicMuteFill className="mr-2 text-16" /> {lang.mutedList}
                          </div>
                        </MenuItem>
                      )}
                      {isMyself && userStore.privateKey && (
                        <MenuItem onClick={() => {
                          state.anchorEl = null;
                          openWalletModal(userStore.privateKey);
                        }}>  
                          <div className="py-1 pl-1 pr-3 flex items-center dark:text-white dark:text-opacity-80 text-neutral-700">
                            <RiKey2Fill className="mr-2 text-16" /> {lang.wallet}
                          </div>
                        </MenuItem>
                      )}
                      {isMyself && isMobile && (
                        <MenuItem onClick={() => {
                          openLanguageModal();
                          state.anchorEl = null;
                        }}>  
                          <div className="py-1 pl-1 pr-3 flex items-center dark:text-white dark:text-opacity-80 text-neutral-700">
                            <MdLanguage className="mr-2 text-16" /> {lang.language}
                          </div>
                        </MenuItem>
                      )}
                      {isMyself && (
                        <MenuItem onClick={() => {
                          exportData();
                        }}>  
                          <div className="py-1 pl-1 pr-3 flex items-center dark:text-white dark:text-opacity-80 text-neutral-700">
                            <BiExport className="mr-2 text-16" /> {lang.exportData}
                            {state.exporting && <div className="ml-2"><Loading size={12} /></div>}
                          </div>
                        </MenuItem>
                      )}
                      {isMyself && isMobile && (
                        <MenuItem onClick={() => {
                          state.anchorEl = null;
                          confirmDialogStore.show({
                            content: lang.youAreSureTo(lang.exit),
                            ok: async () => {
                              confirmDialogStore.hide();
                              await sleep(400);
                              userStore.clear();
                              modalStore.pageLoading.show();
                              window.location.href = `/`;
                            },
                          });
                        }}>  
                          <div className="py-1 pl-1 pr-3 flex items-center text-red-400">
                            <BiLogOutCircle className="mr-2 text-16" /> {lang.exit}
                          </div>
                        </MenuItem>
                      )}
                      {!isMyself && (
                        <MenuItem onClick={() => {
                          state.anchorEl = null;
                          confirmDialogStore.show({
                            content: lang.youAreSureTo(lang.mute),
                            ok: async () => {
                              confirmDialogStore.setLoading(true);
                              await changeRelation('mute');
                              confirmDialogStore.hide();
                            },
                          });
                        }}>
                          <div className="py-1 pl-3 pr-4 flex items-center text-red-400">
                            <BsFillMicMuteFill className="mr-2 text-16" /> {lang.mute}
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
                          {lang.followed}
                        </Button>
                      ) : (
                        <Button
                          isDoing={state.submitting && !confirmDialogStore.open}
                          color='white'
                          onClick={() => changeRelation('follow')}>
                          {lang.follow}
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
                      {isMobile ? lang.edit : lang.editProfile}
                    </Button>
                  )}
                  {!isMyself && user.muted && (
                    <Button
                      color='red'
                      onClick={() => changeRelation('unmute')}>
                        {lang.muted}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <MutedContent enabledMutedMe address={userAddress} className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-60 border dark:border-white dark:border-opacity-20 border-gray-d8/80 border-opacity-80 my-5 py-8 px-4 rounded-12 flex justify-center mx-5" disabledUndoMuted>
            <div className={classNames({
              'opacity-0': state.invisibleOverlay|| !state.fetched || user.postCount === 0
            }, "md:mt-5 w-full box-border dark:md:border-t dark:md:border-l dark:md:border-r dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] md:rounded-12 overflow-hidden")}>
              {postStore.userPosts.map((post) => (
                <div key={post.id}>
                  <PostItem
                    post={post}
                    where="postList"
                    withBorder
                    disabledUserCardTooltip
                  />
                </div>
              ))}
            </div>
          </MutedContent>
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
                {lang.letUsPostSomething}
              </Button>
            </div>
          )}
          {!isMyself && state.fetched && user.postCount === 0 && (
            <div className="py-32 text-center dark:text-white dark:text-opacity-80 text-gray-500 text-14">
              {lang.notExist(lang.content)}
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
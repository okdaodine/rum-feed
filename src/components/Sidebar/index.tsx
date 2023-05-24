import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import { BsPencil } from 'react-icons/bs';
import openEditor from 'components/Post/OpenEditor';
import { MdNotificationsNone } from 'react-icons/md';
import Avatar from 'components/Avatar';
import sleep from 'utils/sleep';
import { MdArrowUpward, MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { BiArrowBack, BiMessageSquareDetail } from 'react-icons/bi';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { isPc, isMobile } from 'utils/env';
import { RiSearchLine, RiSearchFill } from 'react-icons/ri';
import { AiOutlineHome, AiFillHome, AiOutlineSearch, AiOutlineGithub, AiOutlineLink, AiOutlineStar } from 'react-icons/ai';
import { TiArrowForwardOutline } from 'react-icons/ti';
import Badge from '@material-ui/core/Badge';
import classNames from 'classnames';
import openLoginModal from 'components/Wallet/openLoginModal';
import NotificationModal from 'components/Notification/NotificationModal';
import { getSocket } from 'utils/socket';
import { MessageApi, NotificationApi } from 'apis';
import openSearchModal from 'components/openSearchModal';
import qs from 'query-string';
import { useAliveController } from 'react-activation';
import { IoPersonOutline, IoPerson } from 'react-icons/io5';
import Button from 'components/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tabs from './Tabs';
import { scrollToTop } from 'components/TopPlaceHolder';
import copy from 'copy-to-clipboard';
import { lang } from 'utils/lang';
import store from 'store2';
import openLanguageModal from 'components/openLanguageModal';
import { TbActivity } from 'react-icons/tb';
import sum from 'lodash/sum';
import openChatModal from 'components/openChatModal';

export default observer(() => {
  const {
    userStore,
    postStore,
    confirmDialogStore,
    groupStore,
    modalStore,
    pathStore,
    settingStore,
    configStore,
    snackbarStore
  } = useStore();
  const state = useLocalObservable(() => ({
    showBackToTop: true,
    openMessageModal: false,
    notificationUnreadCount: 0,
    chatUnreadCount: 0,
    tabIndex: 1,
    anchorEl: null,
    notificationTab: 0,
  }));
  const history = useHistory();
  const location = useLocation();
  const aliveController = useAliveController();

  const isHomePage = location.pathname === `/`;
  const isSearchPage = location.pathname === `/search`;
  const isGroupsPage = location.pathname === `/groups`;
  const isActivitiesPage = location.pathname === `/activities`;
  const isMyUserPage = location.pathname === `/users/${userStore.address}`;
  const isGroupPage = location.pathname.startsWith(`/groups/`);
  const isPostPage = location.pathname.startsWith(`/posts`);

  React.useEffect(() => {
    if (!userStore.isLogin) {
      return;
    }
    setTimeout(fetchNotificationUnreadCount, 1000);
    setTimeout(fetchChatUnreadCount, 2000);
  }, []);

  const fetchNotificationUnreadCount = async () => {
    try {
      const counts = await Promise.all([
        NotificationApi.getUnreadCount(userStore.address, 'like'),
        NotificationApi.getUnreadCount(userStore.address, 'comment'),
        NotificationApi.getUnreadCount(userStore.address, 'retweet'),
        NotificationApi.getUnreadCount(userStore.address, 'follow')
      ]);
      state.notificationUnreadCount = sum(counts);
      for (const [idx, value] of Object.entries(counts)) {
        if (value > 0) {
          state.notificationTab = Number(idx);
          break;
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  const fetchChatUnreadCount = async () => {
    try {
      state.chatUnreadCount = await MessageApi.getUnreadCount(userStore.address);
    } catch (err) {
      console.log(err);
    }
  }

  React.useEffect(() => {
    if (!userStore.isLogin) {
      return;
    }
    const listener = (notification: any) => {
      console.log({ notification });
      fetchNotificationUnreadCount();
    }
    getSocket().on('notification', listener);
    return () => {
      getSocket().off('notification', listener);
    }
  }, []);

  React.useEffect(() => {
    if (!userStore.isLogin) {
      return;
    }
    const listener = (message: any) => {
      console.log({ message });
      setTimeout(fetchChatUnreadCount, 2000);
    }
    getSocket().on('message', listener);
    return () => {
      getSocket().off('message', listener);
    }
  }, []);

  const onOpenEditor = async () => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    let retweet;
    if (isPostPage) {
      const postId = location.pathname.split('/')[2];
      if (postId) {
        retweet = postStore.map[postId];
      }
    }
    const post = await openEditor({
      retweet
    });
    if (post) {
      await sleep(200);
      if (isPostPage) {
        history.push('/');
        await sleep(200);
      }
      scrollToTop();
      await sleep(200);
      if (isMyUserPage) {
        postStore.addUserPost(post);
        if (postStore.feedType === 'latest') {
          postStore.addPost(post);
        }
      } else if (isGroupPage) {
        postStore.addGroupPost(post);
        if (postStore.feedType === 'latest') {
          postStore.addPost(post);
        }
      } else {
        postStore.addPost(post);
      }
      userStore.updateUser(userStore.address, {
        postCount: userStore.user.postCount + 1
      });
    }
  };

  const logout = async () => {
    confirmDialogStore.show({
      content: lang.youAreSureTo(lang.exit),
      ok: async () => {
        confirmDialogStore.hide();
        await sleep(400);
        store.clear();
        modalStore.pageLoading.show();
        window.location.href = `/`;
      },
    });
  }

  return (
    <div>
      <div className={classNames({
        hidden: (isMobile && isActivitiesPage) || isSearchPage
      }, "fixed top-0 left-0 z-[999] h-[40px] md:h-[42px] flex items-center justify-center w-screen bg-white dark:bg-[#181818] border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-neutral-100")}>
        <div className="w-[600px] flex items-center justify-between">
          {isPc && (
            <div className="absolute top-0 left-[50%] ml-[-400px] mt-1 cursor-pointer px-4" onClick={() => {
              history.push('/');
            }}>
              <img src={configStore.config.logo || "/logo192.png"} alt="logo" width={32} height={32} className="rounded-full" />
            </div>
          )}
          {isHomePage && (
            <Tabs />
          )}
          {!isHomePage && (
            <div
              className="flex items-center cursor-pointer dark:text-white dark:text-opacity-80 text-neutral-500"
              onClick={() => {
                pathStore.paths.length > 0 ? history.goBack() : history.replace(`/`);
              }}>
              <div className="flex items-center text-20 ml-3 md:ml-2">
                <BiArrowBack />
              </div>
              <span className="ml-3 text-15 leading-none mt-[1px]">{lang.back}</span>
            </div>
          )}
          {isPc && !userStore.isLogin && !isGroupsPage && (
            <div className="px-2 opacity-70">
              <Button outline size="mini" onClick={openLoginModal}>{lang.connectWallet}</Button>
            </div>
          )}
          {userStore.isLogin && (
            <div className="flex items-center">
              {(isMobile && isMyUserPage) && (
                <div
                  className="p-1 cursor-pointer pl-1 pr-3 mr-4"
                  onClick={async () => {
                    if (location.pathname === '/favorites') {
                      return;
                    }
                    state.anchorEl = null;
                    await aliveController.drop('favorites');
                    history.push('/favorites');
                  }}>
                  <AiOutlineStar className="text-22 dark:text-white dark:text-opacity-80 text-neutral-400 opacity-80" />
                </div>
              )}
              {isPc && configStore.config.enabledActivities && (
                <div
                  className="p-1 cursor-pointer mr-4"
                  onClick={async () => {
                    if (location.pathname === '/activities') {
                      return;
                    }
                    await aliveController.drop('activities');
                    history.push('/activities');
                  }}>
                  <TbActivity className="text-22 dark:text-white/70 text-neutral-500/90 opacity-70 dark:opacity-100" />
                </div>
              )}
              {(isPc || isMyUserPage) && (
                <div
                  className="p-1 cursor-pointer mr-1 md:mr-4"
                  onClick={() => {
                    settingStore.setTheme(settingStore.isDarkMode ? 'light' : 'dark');
                  }}>
                  <MdOutlineDarkMode className="dark:hidden text-22 dark:text-white/80 text-neutral-500 opacity-60 dark:opacity-100" />
                  <MdOutlineLightMode className="hidden dark:block text-22 dark:text-white/80 text-neutral-500 opacity-60 dark:opacity-100" />
                </div>
              )}
              {isPc && (
                <div
                  className="p-1 cursor-pointer mr-4"
                  onClick={async () => {
                    const result = await openSearchModal();
                    if (result) {
                      postStore.resetSearchedIds();
                      await aliveController.drop('search');
                      history.push(`/search?${qs.stringify(result!, {
                        skipEmptyString: true
                      })}`);
                    }
                  }}>
                  <AiOutlineSearch className="text-22 dark:text-white/80 text-neutral-500 opacity-70 dark:opacity-100" />
                </div>
              )}
              {isMobile && isPostPage && (
                <>
                  <div
                    className="p-1 cursor-pointer mr-6"
                    onClick={onOpenEditor}>
                    <TiArrowForwardOutline className="text-22 dark:text-white dark:text-opacity-80 text-neutral-400 opacity-80" />
                  </div>
                  <div
                    className="p-1 cursor-pointer mr-1"
                    onClick={() => { 
                      copy(window.location.href);
                      snackbarStore.show({
                        message: lang.copied,
                      });
                    }}>
                    <AiOutlineLink className="text-22 dark:text-white dark:text-opacity-80 text-neutral-400 opacity-80" />
                  </div>
                </>
              )}
              <div
                className="py-2 cursor-pointer relative ml-3 pl-3 pr-1 md:pr-1 md:mr-[14px] md:ml-0 md:pl-1"
                onClick={async () => {
                  state.chatUnreadCount = 0;
                  await openChatModal();
                  fetchChatUnreadCount();
                }}
              >
                <div className="absolute top-[-1px] right-[2px] z-10">
                  <Badge
                    badgeContent={state.chatUnreadCount}
                    className='cursor-pointer scale-90'
                    color="error"
                    overlap='rectangular'
                  />
                </div>
                <BiMessageSquareDetail className="text-20 dark:text-white dark:text-opacity-80 text-neutral-400 opacity-80 md:opacity-90" />
              </div>
              <div
                className="px-2 mx-4 md:mx-0 md:mr-5 md:px-1 py-2 cursor-pointer"
                onClick={() => { 
                  state.openMessageModal = true;
                }}>
                <Badge
                  badgeContent={state.notificationUnreadCount}
                  className='transform cursor-pointer scale-90 lower'
                  color="error"
                  overlap='rectangular'
                  onClick={() => { 
                    state.openMessageModal = true;
                  }}
                >
                  <div className="cursor-pointer transform scale-110">
                    <MdNotificationsNone className="text-24 dark:text-white dark:text-opacity-80 text-neutral-400 opacity-80 md:opacity-90" />
                  </div>
                </Badge>
              </div>
              {isPc && (
                <div>
                  <Avatar
                    className="cursor-pointer"
                    url={userStore.profile.avatar}
                    size={30}
                    onClick={(e) => {
                      state.anchorEl = e.currentTarget
                    }}
                  />
                  <Menu
                    anchorEl={state.anchorEl}
                    getContentAnchorEl={null}
                    open={Boolean(state.anchorEl)}
                    onClose={() => {
                      state.anchorEl = null;
                    }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem 
                      onClick={() => {
                        state.anchorEl = null;
                        history.push(`/users/${userStore.address}`);
                      }}>
                      <div className="py-1 px-3 flex items-center">
                        {lang.me}
                      </div>
                    </MenuItem>
                    <MenuItem 
                      onClick={async () => {
                        if (location.pathname === '/favorites') {
                          return;
                        }
                        state.anchorEl = null;
                        await aliveController.drop('favorites');
                        history.push('/favorites');
                      }}>
                      <div className="py-1 px-3 flex items-center">
                        {lang.favorites}
                      </div>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      openLanguageModal();
                      state.anchorEl = null;
                    }}>
                      <div className="py-1 px-3 flex items-center">
                        {lang.language}
                      </div>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      state.anchorEl = null;
                      logout();
                    }}>
                      <div className="py-1 px-3 flex items-center text-red-400">
                        {lang.exit}
                      </div>
                    </MenuItem>
                  </Menu>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isPc && (
        <div className='mt-10 mr-[-430px] scale-100 bottom-[30px] right-[50%] fixed'>
          {(isMyUserPage || (isGroupPage && userStore.isLogin) || (isHomePage && userStore.isLogin)) && (
            <Fade in={true} timeout={350}>
              <div
                className='mt-10 w-10 h-10 mx-auto flex items-center justify-center rounded-full cursor-pointer border border-black dark:bg-white bg-black'
                onClick={onOpenEditor}
              >
                <BsPencil className="text-15 dark:text-black text-white" />
              </div>
            </Fade>
          )}
          {state.showBackToTop && (
            <Fade in={true} timeout={350}>
              <div
                className='mt-10 w-10 h-10 mx-auto rounded-full flex items-center justify-center cursor-pointer border dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-c4'
                onClick={() => scrollToTop()}
              >
                <MdArrowUpward className="text-20 dark:text-white dark:text-opacity-80 text-gray-af" />
              </div>
            </Fade>
          )}
        </div>
      )}

      {isPc && configStore.config.repo && (
        <Fade in={true} timeout={350}>
          <div
            className='fixed bottom-5 right-5 w-10 h-10 mx-auto rounded-full hidden md:flex items-center justify-center cursor-pointer'
            onClick={() => {
              window.open(configStore.config.repo);
            }}
          >
            <AiOutlineGithub className="text-20 dark:text-white/30 text-gray-af/70" />
          </div>
        </Fade>
      )}

      {isMobile && (
        <div>
          {(isHomePage || isMyUserPage || isGroupPage) && userStore.isLogin && (
            <Fade in={true} timeout={350}>
              <div
                className='fixed bottom-[80px] right-6 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border border-black dark:bg-white dark:bg-opacity-80 bg-black z-50 ios-safe-area-margin'
                onClick={onOpenEditor}
              >
                <BsPencil className="text-20 opacity-90 dark:text-black text-white" />
              </div>
            </Fade>
          )}
          {(isHomePage || isMyUserPage || isSearchPage || isActivitiesPage) && (
            <div>
              <div className="ios-safe-area-padding pt-[6px] fixed bottom-0 left-0 w-screen flex justify-around dark:text-white dark:text-opacity-80 text-gray-88 text-12 border-t dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-neutral-100 bg-white dark:bg-[#181818] z-50">
                <div
                  className={classNames(
                    {
                      'dark:text-white dark:text-opacity-80 text-black': isHomePage,
                    },
                    'px-4 text-center flex flex-col items-center',
                  )}
                  onClick={() => {
                    const path = `/`;
                    if (location.pathname !== path) {
                      history.push(path);
                    }
                  }}
                >
                  <div className="flex items-center justify-center text-24 h-6 w-6">
                    {isHomePage ? <AiFillHome /> : <AiOutlineHome />}
                  </div>
                  <div className="transform scale-90">{lang.home}</div>
                </div>
                {configStore.config.enabledActivities && (
                  <div
                    className={classNames(
                      {
                        'dark:text-white dark:text-opacity-80 text-black': isActivitiesPage,
                      },
                      'px-4 text-center flex flex-col items-center',
                    )}
                    onClick={async () => {
                      if (location.pathname === '/activities') {
                        return;
                      }
                      await aliveController.drop('activities');
                      history.push('/activities');
                    }}
                  >
                    <div className="flex items-center justify-center text-24 h-6 w-6">
                      {isActivitiesPage ? <TbActivity /> : <TbActivity />}
                    </div>
                    <div className="transform scale-90">{lang.activities}</div>
                  </div>
                )}
                <div
                  className={classNames(
                    {
                      'dark:text-white dark:text-opacity-80 text-black': isSearchPage,
                    },
                    'px-4 text-center flex flex-col items-center',
                  )}
                  onClick={async () => {
                    if (!userStore.isLogin) {
                      openLoginModal();
                      return;
                    }
                    postStore.resetSearchedIds();
                    await aliveController.drop('search');
                    history.push(`/search`);
                  }}
                >
                  <div className="flex items-center justify-center text-24 h-6 w-6">
                    {isSearchPage ? <RiSearchFill /> : <RiSearchLine />}
                  </div>
                  <div className="transform scale-90">{lang.search}</div>
                </div>
                <div
                  className={classNames(
                    {
                      'dark:text-white dark:text-opacity-80 text-black': isMyUserPage,
                    },
                    'px-4 text-center flex flex-col items-center',
                  )}
                  onClick={() => {
                    if (!userStore.isLogin) {
                      openLoginModal();
                      return;
                    }
                    const path = `/users/${userStore.address}`;
                    if (location.pathname !== path) {
                      history.push(path);
                    }
                  }}
                >
                  <div className="flex items-center justify-center text-26 h-6 w-6">
                    {isMyUserPage ? <IoPerson /> : <IoPersonOutline />}
                  </div>
                  <div className="transform scale-90">{lang.me}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <NotificationModal
        tab={state.notificationTab}
        open={state.openMessageModal}
        onClose={() => {
          state.openMessageModal = false;
          fetchNotificationUnreadCount();
        }}
        addReadCount={(count) => {
          if (state.notificationUnreadCount >= count) {
            state.notificationUnreadCount -= count
          }
        }}
      />
    </div>
  );
});

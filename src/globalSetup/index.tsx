import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { initSocket, getSocket } from 'utils/socket';
import { useStore } from 'store';
import { TrxStorage } from 'apis/common';
import { IComment, IPost } from 'apis/types';
import { useLocation, useHistory } from 'react-router-dom';
import Sidebar from 'components/Sidebar';
import { isMobile } from 'utils/env';

export default observer(() => {
  const {
    userStore,
    commentStore,
    postStore,
    pathStore,
    confirmDialogStore,
    configStore
  } = useStore();
  const location = useLocation();
  const history = useHistory();
  const state = useLocalObservable(() => ({
    ready: false,
  }));
  
  React.useEffect(() => {
    initSocket();
    state.ready = true;
  }, []);

  React.useEffect(() => {
    const connectSocket = () => {
      getSocket().emit('authenticate', {
        userAddress: userStore.address
      });
    }
    getSocket().on('authenticateResult', (result: string) => {
      console.log(result);
    });
    getSocket().on('connect', () => {
      if (userStore.isLogin) {
        connectSocket();
      }
    });
  }, []);

  React.useEffect(() => {
    const listener = async (comment: IComment) => {
      console.log('received a comment');
      console.log({ comment });
      commentStore.updateComment({
        ...(commentStore.map[comment.trxId] || comment),
        storage: TrxStorage.chain
      });
    }
    getSocket().on('comment', listener);
    return () => {
      getSocket().off('comment', listener);
    }
  }, []);

  React.useEffect(() => {
    const listener = (post: IPost) => {
      console.log('received a post', post);
      console.log({ post });
      postStore.updatePost({
        ...(postStore.map[post.trxId] || post),
        storage: TrxStorage.chain
      });
    }
    getSocket().on('post', listener);
    return () => {
      getSocket().off('post', listener);
    }
  }, []);

  React.useEffect(() => {
    const body = document.querySelector('body') as any;
    if (body) {
      const listener = (e: any) => {
        if (e.target && e.target.id === 'marker') {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (e.target && e.target.tagName === 'A') {
          e.preventDefault();
          e.stopPropagation();
          const href = e.target.getAttribute('href');
          const disabled = e.target.hasAttribute('disabled');
          if (disabled || !href) {
            return;
          }
          if (href.startsWith('http')) {
            const { origin } = new URL(href);
            if (origin !== window.origin) {
              confirmDialogStore.show({
                content: `确定打开外部链接？<div class="text-12 max-w-[250px] break-words leading-[1.5] opacity-80 mt-2">${href.slice(0, 200)}</div>`,
                ok: () => {
                  isMobile ? confirmDialogStore.setLoading(true) : confirmDialogStore.hide();
                  isMobile ? window.location.href = href : window.open(href);
                },
              });
            } else {
              isMobile ? window.location.href = href : window.open(href);
            }
          }
          if (href.startsWith('#')) {
            const { pathname } = window.location;
            if (pathname === '/search') {
              history.replace(`/search?q=${encodeURIComponent(href)}`);
            } else {
              history.push(`/search?q=${encodeURIComponent(href)}`);
            }
          }
        }
      };
      body.addEventListener('click', listener);
    }
  }, []);

  React.useEffect(() => {
    const { pathname } = location;
    if (pathname === `/`) {
      document.title = configStore.config.title || 'Rum 微博广场';
    } else if (pathname === `/search`) {
      document.title = '搜索';
    }
  }, [location.pathname]);

  React.useEffect(() => {
    const { push } = history;
    history.push = (path: string) => {
      if (path === window.location.pathname) {
        return;
      }
      push(path);
    }
    history.listen((data, action) => {
      const { pathname } = data;
      if (action === 'PUSH') {
        pathStore.push(pathname);
      } else if (action === 'POP') {
        pathStore.pop();
      }
    })
  }, []);

  if (!state.ready) {
    return null
  }
  
  return <Sidebar />;
});
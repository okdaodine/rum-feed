import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { initSocket, getSocket } from 'utils/socket';
import { useStore } from 'store';
import { TrxStorage } from 'apis/common';
import { IComment, IPost } from 'apis/types';
import { useLocation, useHistory } from 'react-router-dom';
import Sidebar from 'components/Sidebar';
import { isMobile } from 'utils/env';
import { lang } from 'utils/lang';
import { V1ContentApi, TrxApi } from 'apis';
import sleep from 'utils/sleep';

export default observer(() => {
  const {
    userStore,
    commentStore,
    postStore,
    pathStore,
    confirmDialogStore,
    configStore,
    groupStore
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
    getSocket().on('authenticateResult', (_result: string) => {});
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
        ...(commentStore.map[comment.id] || comment),
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
        ...(postStore.map[post.id] || post),
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
          if (e.target.getAttribute('download')) {
            return;
          }
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
                content: `${lang.youAreSureTo(lang.openExternalLink)}<div class="text-12 max-w-[250px] break-words leading-[1.5] opacity-80 mt-2">${href.slice(0, 200)}</div>`,
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
      document.title = configStore.config.siteName || 'Rum Feed';
    } else if (pathname === `/search`) {
      document.title = lang.search;
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

  React.useEffect(() => {
    if (userStore.isLogin) {
      (async () => {
        while (true) {
          await sleep(10 * 1000);
          try {
            const trxIds = await V1ContentApi.listTrxIds(userStore.address);
            if (trxIds.length > 0) {
              console.log(`Handling ${trxIds.length} v1Contents`);
            }
            for (const trxId of trxIds) {
              await sleep(100);
              try {
                const v1Content = await V1ContentApi.get(trxId);
                if (v1Content && v1Content.status !== 'done') {
                  const group = groupStore.map[v1Content.groupId];
                  if (!group.extra.rawGroup.appKey.includes('v1')) {
                    await TrxApi.createActivity({
                      ...v1Content.data,
                      published: new Date(Number(v1Content.raw.TimeStamp.slice(0, 13))).toISOString()
                    }, v1Content.groupId, '', {
                      trxId: v1Content.trxId,
                    });
                    await V1ContentApi.done(v1Content.trxId);
                  }
                }
              } catch (err) {
                console.log(err);
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      })();
    }
  }, []);

  if (!state.ready) {
    return null
  }
  
  return <Sidebar />;
});
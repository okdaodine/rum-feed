import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import TextField from '@material-ui/core/TextField';
import EthCrypto from  'utils/ethCrypto';
import { useStore } from 'store';
import { BiLockAlt } from 'react-icons/bi';
import { MdSend } from 'react-icons/md';
import pubKeyUtils from 'utils/pubKeyUtils';
import { MessageApi, TrxApi } from 'apis';
import { IMessage } from 'apis/types';
import { getSocket } from 'utils/socket';
import ago from 'utils/ago';
import classNames from 'classnames';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import { v4 as uuid } from 'uuid';
import urlify from 'utils/urlify';

interface IProps {
  toPubKey: string
  conversationId: string
}

export default observer((props: IProps) => {
  const { userStore, relationStore, confirmDialogStore, snackbarStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    loading: false,
    pending: true,
    messages: [] as IMessage[],
    value: '',
    get firstUnreadMessage() {
      return this.messages.find(message => message.toAddress === userStore.address && message.status === 'unread')
    }
  }));
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleMessages = async (messages: IMessage[]) => {
    const encryptedHexes = messages.map(message => (message.fromAddress === userStore.address ? message.fromContent : message.toContent))
    const decryptedItems = await EthCrypto.bulkDecrypt({
      encryptedHexes,
      privateKey: userStore.privateKey,
      vaultJWT: userStore.jwt,
    });
    for (const message of messages) {
      const decryptedItem = decryptedItems.shift()!;
      if (!decryptedItem) {
        continue;
      }
      if (message.fromAddress === userStore.address) {
        message.fromContent = decryptedItem.senderAddress === message.fromAddress ? decryptedItem.message : 'Mismatch address';
      } else {
        message.toContent = decryptedItem.senderAddress === message.fromAddress ? decryptedItem.message : 'Mismatch address';
      }
    }
  }

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      try {
        const messages = await MessageApi.listMessages(props.conversationId, {
          limit: 999,
          offset: 0,
          viewer: userStore.address,
        });
        await handleMessages(messages);
        state.messages = messages;
      } catch (err) {
        console.log(err);
      }
      state.loading = false;
      await sleep(100);
      const unreadBar = document.querySelector('#unread-bar');
      if (unreadBar) {
        unreadBar.scrollIntoView({
          block: 'start'
        });
      } else {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 9999;
        }
      }
      state.pending = false;
    })();
  }, []);

  React.useEffect(() => {
    const listener = async (message: IMessage) => {
      console.log(`[chatRoom]:`, { message });
      if (message.conversationId !== props.conversationId) {
        return;
      }
      await handleMessages([message]);
      state.messages.push({
        ...message,
        status: 'read'
      });
      await sleep(10);
      if (scrollRef.current) {
        scrollRef.current.scroll({
          behavior: 'smooth',
          top: 9999,
        });
      }
      await MessageApi.markAsRead(message.conversationId, message.toAddress);
    }
    getSocket().on('message', listener);
    return () => {
      getSocket().off('message', listener);
    }
  }, []);

  const submit = async (value: string) => {
    if (!value) {
      return;
    }
    if (relationStore.mutedMe.has(pubKeyUtils.getAddress(props.toPubKey))) {
      confirmDialogStore.show({
        content: lang.unableToUseDMOfMuted,
        cancelDisabled: true,
        okText: lang.gotIt,
        ok: async () => {
          confirmDialogStore.hide();
        },
      });
      return;
    }
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
    try {
      const message = {
        uuid: uuid(),
        conversationId: props.conversationId,
        fromAddress: userStore.address,
        fromPubKey: userStore.user.pubKey,
        fromContent: value,
        toAddress: pubKeyUtils.getAddress(props.toPubKey),
        toPubKey: props.toPubKey,
        toContent: value,
        timestamp: new Date().toISOString(),
        status: 'unread'
      };
      state.messages.push({
        ...message,
      });
      state.value = '';
      await sleep(10);
      if (scrollRef.current) {
        scrollRef.current.scroll({
          behavior: 'smooth',
          top: 9999,
        });
      }
      message.fromContent = await EthCrypto.encrypt({
        message: message.fromContent,
        publicKey: pubKeyUtils.decompress(userStore.user.pubKey!),
        privateKey: userStore.privateKey,
        vaultJWT: userStore.jwt,
      });
      message.toContent = await EthCrypto.encrypt({
        message: message.toContent,
        publicKey: pubKeyUtils.decompress(props.toPubKey),
        privateKey: userStore.privateKey,
        vaultJWT: userStore.jwt,
      });
      await MessageApi.createMessage(message);
      await TrxApi.createActivity({
        type: 'CreateDirectMessage',
        object: {
          type: 'DirectMessage',
          content: JSON.stringify({
            ...message,
            status: '',
          })
        }
      }, groupStore.directMessageGroup.groupId);
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <Fade in={true} timeout={350}>
      <div>
        <div className="h-[60vh] md:h-[508px] md:max-h-[80vh] box-border px-5 relative flex flex-col">
          <div className={classNames({
            'invisible': state.pending
          }, "flex-1 overflow-y-auto w-full overflow-x-hidden")} ref={scrollRef}>
            <div className="tracking-wide text-12 py-[6px] px-2 flex items-center justify-center mt-6 md:mt-4 rounded-12 mb-1 dark:text-white/50 text-gray-700/70">
              <BiLockAlt className="text-18 mr-[6px] dark:text-white/40 text-gray-700/50 flex-shrink-0" /> 点对点加密, 消息只有你们两人可见
            </div>
            {state.messages.length > 0 && <div className="pt-5" />}
            {state.messages.map((message, index) => {
              const nextMessage = state.messages[index + 1];
              const myNextMessage = nextMessage && message.fromAddress === nextMessage.fromAddress ? nextMessage : null;
              return (
                <div key={message.uuid}>
                  {index > 0 && state.firstUnreadMessage === message && (
                    <div id="unread-bar" className="pt-3 mb-5">
                      <div className="py-[2px] text-center bg-slate-300/50 text-black/50 dark:bg-slate-200/10 dark:text-white/50 text-13 rounded-12">未读消息</div>
                    </div>
                  )}
                  {message.toAddress === userStore.address && (
                    <div className="bg-slate-300/70 text-black/80 dark:bg-slate-300/10 dark:text-white/90 py-[10px] px-[14px] max-w-[80%] inline-block rounded-12 break-words whitespace-pre-wrap">
                      <div dangerouslySetInnerHTML={{ __html: urlify(message.toContent) }} />
                    </div>
                  )}
                  {message.fromAddress === userStore.address && (
                    <div className="flex justify-end">
                      <div className="bg-black/90 text-white dark:bg-white dark:text-black/90 py-[10px] px-[14px] max-w-[80%] inline-block rounded-12 break-words whitespace-pre-wrap">
                        <div dangerouslySetInnerHTML={{ __html: urlify(message.fromContent) }} />
                      </div>
                    </div>
                  )}
                  <div className="mt-1 pb-1 dark:text-white/50 text-gray-700/60">
                    {!myNextMessage && (
                      <div className={classNames({
                        'flex justify-end': message.fromAddress === userStore.address
                      }, "text-[10px] px-1 tracking-wide")}>
                        {ago(new Date(message.timestamp).getTime(), {
                          disabledText: true,
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-2 pb-3 flex items-center">
            <div className="flex-1">
              <TextField
                placeholder='说点什么...'
                value={state.value}
                onChange={(e) => { state.value = e.target.value; }}
                variant="outlined"
                fullWidth
                multiline
                inputProps={{
                  enterKeyHint: 'send'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && state.value) {
                    if (e.shiftKey) {
                      return;
                    }
                    if (e.altKey || e.ctrlKey || e.metaKey) {
                      state.value += '\n';
                      return;
                    }
                    e.preventDefault();
                    submit(state.value.trim());
                  }
                }}
              />
            </div>
            <div className={classNames({
              'opacity-30': !state.value.trim(),
            }, "pl-4 -mr-1 py-2 cursor-pointer text-black/90 dark:text-white/90")} onClick={() => {
              submit(state.value.trim());
            }}>
              <MdSend className="text-24" />
            </div>
          </div>
          {state.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818] z-20">
              <div className="-mt-20 opacity-50">
                {lang.loading}
              </div>
            </div>
          )}
        </div>
      </div>
    </Fade>
  )
});

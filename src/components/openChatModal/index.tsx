import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { useStore } from 'store';
import ago from 'utils/ago';
import { BiArrowBack } from 'react-icons/bi';
import ChatRoom from './ChatRoom';
import { IProfile, IConversation, IMessage } from 'apis/types';
import { MessageApi, TrxApi } from 'apis';
import EthCrypto from 'utils/ethCrypto';
import { runInAction } from 'mobx';
import Badge from '@material-ui/core/Badge';
import sleep from 'utils/sleep';
import { getSocket } from 'utils/socket';
import pubKeyUtils from 'utils/pubKeyUtils';
import { BsFillMicMuteFill } from 'react-icons/bs';
import classNames from 'classnames';

interface IProps {
  toPubKey?: string
  toUserProfile?: IProfile
}

interface IModalProps extends IProps {
  rs: () => void
}

const ModalWrapper = observer((props: IModalProps) => {
  const { snackbarStore, userStore, confirmDialogStore, groupStore, relationStore } = useStore();
  const state = useLocalObservable(() => ({
    open: false,
    fetched: false,
    conversationIds: [] as string[],
    conversationMap: {} as Record<string, IConversation>,
    get conversations() {
      return this.conversationIds.map(id => this.conversationMap[id]);
    },
    conversationId: props.toPubKey ? getConversationId(userStore.address, pubKeyUtils.getAddress(props.toPubKey)) : '',
    toPubKey: props.toPubKey || '',
    toUserProfile: (props.toUserProfile || {}) as IProfile,
    get toAddress() {
      return this.toPubKey ? pubKeyUtils.getAddress(this.toPubKey) : ''
    }
  }));

  const handleConversations = async (items: IConversation[]) => {
    const encryptedHexes = items.map(item => (item.fromAddress === userStore.address ? item.fromContent : item.toContent))
    const decryptedItems = await EthCrypto.bulkDecrypt({
      encryptedHexes,
      privateKey: userStore.privateKey,
      vaultJWT: userStore.jwt,
    });
    for (const item of items) {
      const decryptedItem = decryptedItems.shift()!;
      if (item.fromAddress === userStore.address) {
        item.fromContent = [item.fromAddress, item.toAddress].includes(decryptedItem.senderAddress) ? decryptedItem.message : 'Mismatch address';
      } else {
        item.toContent = [item.fromAddress, item.toAddress].includes(decryptedItem.senderAddress) ? decryptedItem.message : 'Mismatch address';
      }
    }
  }

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        let conversations = await MessageApi.listConversations(userStore.address);
        await handleConversations(conversations);
        runInAction(() => {
          for (const conversation of conversations) {
            state.conversationMap[conversation.conversationId] = conversation;
            if (!state.conversationIds.includes(conversation.conversationId)) {
              state.conversationIds.push(conversation.conversationId);
            }
          }
        });
      } catch (err) {
        console.error(err);
        snackbarStore.show({
          message: lang.somethingWrong,
          type: 'error',
        });
      }
      state.fetched = true;
    })();
  }, [state.toPubKey]);

  React.useEffect(() => {
    const listener = async (message: IMessage) => {
      console.log(`[openChatModal index]:`, { message });
      const conversation = state.conversationMap[message.conversationId];
      if (conversation) {
        const updatedConversation = {
          ...conversation,
          timestamp: message.timestamp
        };
        if (updatedConversation.fromAddress === userStore.address) {
          updatedConversation.fromContent = message.toContent;
        }
        if (updatedConversation.toAddress === userStore.address) {
          updatedConversation.toContent = message.toContent;
        }
        await handleConversations([updatedConversation]);
        if (!state.toPubKey) {
          updatedConversation.unreadCount += 1;
        }
        console.log(`[openChatModal index]:`, { updatedConversation });
        state.conversationMap[message.conversationId] = updatedConversation;
      }
    }
    getSocket().on('message', listener);
    return () => {
      getSocket().off('message', listener);
    }
  }, []);

  const handleClose = () => {
    state.open = false;
    props.rs();
  };

  const mute = async (userAddress: string) => {
    confirmDialogStore.show({
      content: lang.youAreSureTo(lang.mute),
      ok: async () => {
        confirmDialogStore.setLoading(true);
        try {
          const block = {
            type: 'Block',
            object: {
              type: 'Person',
              id: userAddress,
            },
          }
          await TrxApi.createActivity(block, groupStore.relationGroup.groupId);
          confirmDialogStore.hide();
          await sleep(200);
          relationStore.muted.add(userAddress);
          await sleep(400);
          snackbarStore.show({
            message: lang.muted,
          });
        } catch (err) {
          console.log(err);
          confirmDialogStore.hide();
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  }

  return (
    <Modal
      hideCloseButton
      open={state.open}
      onClose={() => handleClose()}
    >
      <div className="relative w-full md:w-[360px]">
        <div className="py-3 text-18 font-bold dark:text-white/80 text-gray-700 text-center border-b dark:border-white/10 border-neutral-100">
          <div className={state.toPubKey ? 'invisible' : ''}>
            私信
          </div>
          {state.toPubKey && (
            <div className="flex items-center justify-center absolute top-4 z-50 opacity-90 w-full">
              <div className="text-20 px-5 absolute top-[2px] left-0 cursor-pointer" onClick={() => {
                runInAction(() => {
                  state.toPubKey = '';
                  state.conversationId = '';
                });
              }}>
                <BiArrowBack />
              </div>
              <div className="flex items-center cursor-pointer" onClick={async () => {
                handleClose();
                await sleep(400);
                const path = `/users/${state.toAddress}`;
                if (window.location.pathname !== path) {
                  window.location.href = path;
                } 
              }}>
                <img src={state.toUserProfile?.avatar} alt="avatar" className="w-[22px] h-[22px] rounded-full flex-shrink-0" />
                <div className="ml-2 text-16 truncate max-w-[200px]">{state.toUserProfile?.name}</div>
              </div>
              <div className={classNames({
                'text-red-400': relationStore.muted.has(state.toAddress) || relationStore.mutedMe.has(state.toAddress)
              }, "text-16 px-4 absolute top-[4px] right-0 cursor-pointer")} onClick={() => {
                if (!relationStore.muted.has(state.toAddress) && !relationStore.mutedMe.has(state.toAddress)) {
                  mute(state.toAddress);
                }
              }}>
                <BsFillMicMuteFill />
              </div>
            </div>
          )}
        </div>
        {!state.toPubKey && (
          <div className="h-[60vh] md:h-[508px] md:max-h-[80vh] box-border overflow-y-auto pt-[2px] relative">
            {state.conversations.map(item => {
              const toPubKey = item.fromAddress === userStore.address ? item.toPubKey : item.fromPubKey;
              const toUserProfile = item.fromAddress === userStore.address ? item.toUserProfile : item.fromUserProfile;
              const content = item.fromAddress === userStore.address ? item.fromContent : item.toContent;
              return (
                <div key={item.conversationId} className="pl-4 pr-1 text-gray-4a dark:text-white/80 cursor-pointer relative" onClick={async () => {
                  runInAction(() => {
                    state.toPubKey = toPubKey;
                    state.conversationId = getConversationId(userStore.address, pubKeyUtils.getAddress(toPubKey));
                    state.toUserProfile = toUserProfile;
                  });
                  await sleep(500);
                  item.unreadCount = 0;
                }}>
                  <div className="flex items-center relative">
                    <img src={toUserProfile.avatar} alt="avatar" className="w-[42px] h-[42px] rounded-full flex-shrink-0" />
                    <div className="py-2 flex items-center flex-1 ml-3 leading-1 flex-wrap border-b dark:border-white/10 border-neutral-100">
                      <div>
                        <div className="truncate max-w-[70vw] md:max-w-[240] text-[14px]">
                          {toUserProfile.name}
                        </div>
                        <div className="mt-[2px] opacity-60 text-[13px]">
                          <div className="truncate max-w-[254px] mr-1">{content}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-[12px] opacity-60 dark:opacity-50 absolute top-[8px] right-[14px] tracking-wide">{ago(new Date(item.timestamp).getTime(), {
                      disabledText: true,
                    })}</div>
                    <div className="text-[10px] opacity-60 dark:opacity-50 absolute top-[30px] right-[22px] tracking-wide">
                      <Badge
                        badgeContent={item.unreadCount}
                        className="scale-75 cursor-pointer"
                        color="error"
                        overlap="rectangular"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {state.conversations.length === 0 && <div className="py-32 text-center dark:text-white/60 text-gray-500 text-14">空空如也 ~</div>}
            {!state.fetched && !state.toPubKey && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818]">
                <div className="-mt-20 opacity-50">
                  加载中...
                </div>
              </div>
            )}
          </div>
        )}
        {state.toPubKey && (
          <ChatRoom toPubKey={state.toPubKey} conversationId={state.conversationId}  />
        )}
      </div>
    </Modal>
  )
});

export default async (props?: IProps) => new Promise((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <ModalWrapper
            {...props}
            rs={() => {
              rs(true);
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

const getConversationId = (address1: string, address2: string) => {
  if (address1 > address2) {
    return `${address1}_${address2}`;
  }
  return `${address2}_${address1}`;
}
import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import Button from 'components/Button';
import Loading from 'components/Loading';
import Modal from 'components/Modal';
import { IRelation } from 'apis/types';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { RelationApi } from 'apis';
import sleep from 'utils/sleep';
import { useHistory } from 'react-router-dom';
import { lang } from 'utils/lang';
import { TrxApi } from 'apis';
import UserName from 'components/UserName';

interface IProps {
  userAddress: string
  type: 'following' | 'followers' | 'muted'
  open: boolean
  onClose: () => void
}

const LIMIT = 20;

const UserList = observer((props: IProps) => {
  const { groupStore, userStore, snackbarStore, confirmDialogStore } = useStore();
  const state = useLocalStore(() => ({
    hasMore: false,
    page: 0,
    fetching: false,
    fetched: false,
    submitting: false,
    relations: [] as IRelation[],
  }));
  const history = useHistory();
  const isMyList = props.userAddress === userStore.address;

  React.useEffect(() => {
    (async () => {
      state.fetching = true;
      try {
        let relations = [] as IRelation[];
        if (props.type === 'following') {
          relations = await RelationApi.listFollowing(props.userAddress, { offset: state.page * LIMIT, limit: LIMIT });
        } else if (props.type === 'followers') {
          relations = await RelationApi.listFollowers(props.userAddress, { offset: state.page * LIMIT, limit: LIMIT });
        } else if (props.type === 'muted') {
          relations = await RelationApi.listMuted(props.userAddress, { offset: state.page * LIMIT, limit: LIMIT });
        }
        state.relations.push(...relations);
        state.hasMore = relations.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.fetching = false;
      state.fetched = true;
    })();
  }, [state, state.page]);

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.fetching,
    hasNextPage: state.hasMore,
    rootMargin: '0px 0px 300px 0px',
    onLoadMore: async () => {
      state.page += 1;
    },
  });

  const changeRelation = async (type: 'unfollow' | 'unmute', relation: IRelation) => {
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
            to: relation.to
          })
        },
      });
      console.log(res);
      state.relations = state.relations.filter(r => r.to !== relation.to);
      if (type === 'unfollow') {
        userStore.updateUser(userStore.address, {
          followingCount: userStore.user.followingCount - 1,
          following: !userStore.user.following
        });
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

  return (
    <div className="bg-white dark:bg-[#181818] rounded-12 dark:text-white dark:text-opacity-80 text-gray-4a">
      <div className="px-5 py-4 leading-none text-16 border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-d8 border-opacity-75 flex justify-between items-center">
        {props.type === 'following' && `${isMyList ? '我' : 'Ta '}关注的人`}
        {props.type === 'followers' && `关注${isMyList ? '我' : ' Ta '}的人`}
        {props.type === 'muted' && '我屏蔽掉的人'}
      </div>
      <div className="w-full md:w-[350px] h-[80vh] md:h-[400px] overflow-y-auto" ref={rootRef}>
        {!state.fetched && (
          <div className="pt-24 flex items-center justify-center">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <div>
            {state.relations.map((relation) => {
              const isMyself = relation.to === userStore.address;
              return (
                <div
                  className="border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-200 py-3 px-5 flex items-center justify-between"
                  key={relation.to}
                >
                  <div
                    onClick={async () => {
                      props.onClose();
                      await sleep(200);
                      history.push(`/users/${relation.to}`);
                    }}
                  >
                    <div className="flex items-center cursor-pointer">
                      <img
                        className="w-10 h-10 rounded-full"
                        src={relation.extra.userProfile.avatar}
                        alt={relation.extra.userProfile.name}
                      />
                      <div className="ml-3">
                        <UserName
                          name={relation.extra.userProfile.name}
                          normalNameClass="text-14 truncate max-w-[160px] md:max-w-[140px]"
                          fromNameClass="text-14 truncate max-w-[160px] md:max-w-[140px]"
                          fromIconClass="text-20 mx-1"
                          fromIdClass="hidden"
                          />
                      </div>
                    </div>
                  </div>
                  {!isMyself && (
                    <div>
                      {isMyList && (
                        <div>
                          {props.type === 'following' && (  
                            <Button size="small" onClick={() => {
                              confirmDialogStore.show({
                                content: '确定取消关注吗？',
                                ok: async () => {
                                  confirmDialogStore.setLoading(true);
                                  await changeRelation('unfollow', relation)
                                  confirmDialogStore.hide();
                                },
                              });
                            }} outline>
                              取消关注
                            </Button>
                          )}
                          {props.type === 'muted' && (  
                            <Button size="small" color="red" onClick={() => {
                              confirmDialogStore.show({
                                content: '确定解除屏蔽吗？',
                                ok: async () => {
                                  confirmDialogStore.setLoading(true);
                                  await changeRelation('unmute', relation);
                                  confirmDialogStore.hide();
                                },
                              });
                            }} outline>
                              解除屏蔽
                            </Button>
                          )}
                        </div>  
                      )}
                    </div>
                  )}
                  {(!isMyList ||props.type === 'followers') && (  
                    <Button
                      size="small"
                      outline 
                      onClick={async () => {
                        props.onClose();
                        await sleep(200);
                        history.push(`/users/${relation.extra.userProfile.userAddress}`);
                      }}>
                      打开主页
                    </Button>
                  )}
                </div>
              );
            })}
            {state.relations.length === 0 && (
              <div className="py-28 text-center text-14 dark:text-white dark:text-opacity-80 text-gray-400 opacity-80">
                空空如也 ~
              </div>
            )}
            {state.fetching && (
              <div className="py-8 flex items-center justify-center">
                <Loading />
              </div>
            )}
          </div>
        )}
        <div ref={sentryRef} />
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  const { open, onClose } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <UserList { ...props } />
    </Modal>
  );
});

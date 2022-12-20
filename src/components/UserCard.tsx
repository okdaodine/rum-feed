import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Tooltip from '@material-ui/core/Tooltip';
import Avatar from 'components/Avatar';
import { ProfileApi, UserApi } from 'apis';
import { IProfile } from 'apis/types';
import Loading from 'components/Loading';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import { isPc, isMobile } from 'utils/env';
import Button from 'components/Button';
import openLoginModal from 'components/openLoginModal';
import { TrxApi } from 'apis';
import { lang } from 'utils/lang';
import UserName from 'components/UserName';

interface IProps {
  disableHover?: boolean
  userAddress: string
  children: React.ReactNode
  className?: string
}

interface IUserCardProps extends IProps {
  goToUserPage: () => void
}

const UserCard = observer((props: IUserCardProps) => {
  const { groupStore, userStore, snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    profile: {} as IProfile,
    fetched: false,
    submitting: false
  }));
  const { profile } = state;
  const user = userStore.userMap[props.userAddress]!;
  const isMyself = props.userAddress === userStore.address;

  React.useEffect(() => {
    (async () => {
      try {
        state.profile = await ProfileApi.get(props.userAddress);
        if (!user) {
          const user = await UserApi.get(props.userAddress, {
            viewer: userStore.address
          });
          userStore.setUser(props.userAddress, user);
        }
      } catch (_) {}
      await sleep(200);
      state.fetched = true;
    })();
  }, []);

  const changeRelation = async (type: 'follow' | 'unfollow') => {
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
            to: props.userAddress
          })
        },
      });
      console.log(res);
      userStore.updateUser(props.userAddress, {
        followerCount: user.followerCount + (type === 'follow' ? 1 : -1),
        following: !user.following
      });
      userStore.updateUser(userStore.address, {
        followingCount: userStore.user.followingCount + (type === 'follow' ? 1 : -1),
      });
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
    <div className="popover-paper bg-white dark:bg-[#181818] mr-2 shadow-lg rounded-12 overflow-hidden border dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-bd leading-none relative w-[270px] pt-5 pb-5 px-[22px] min-h-[175px]">
      {state.fetched && (
        <div>
          <div
            className="cursor-pointer"
          >
            <div className="relative flex items-center" onClick={props.goToUserPage}>
              <Avatar
                className="absolute top-0 left-0 cursor-pointer"
                url={profile.avatar}
                size={70}
              />
              <div className="pt-[88px]">
                <UserName
                  name={profile.name}
                  normalNameClass="text-15 truncate dark:text-white dark:text-opacity-80 text-gray-6d font-bold"
                  fromNameClass="text-15 opacity-80 md:opacity-100 truncate font-bold dark:text-white dark:text-opacity-80 text-gray-6d max-w-[180px]"
                  fromIconClass="text-24 text-sky-500 mx-1"
                  fromIdClass="hidden"
                  />
                {user.postCount === 0 && <div className="pb-2" />}
              </div>
            </div>
          </div>

          <div className="text-13 flex items-center dark:text-white dark:text-opacity-80 text-neutral-400 pt-4">
            <span>
              {' '}
              <span className="text-14 font-bold">
                {user.postCount}
              </span> 内容{' '}
            </span>
            <span className="mx-[10px] opacity-50">|</span>
            <span>
              <span className="text-14 font-bold">
                {user.followingCount}
              </span>{' '}
              关注{' '}
            </span>
            <span className="opacity-50 mx-[10px]">|</span>
            <span>
              <span className="text-14 font-bold">{user.followerCount}</span>{' '}
              被关注
            </span>
          </div>

          {!isMyself && (
            <div className="absolute top-8 right-5">
              <div>
                {user.following ?
                  <Button isDoing={state.submitting} outline onClick={() => changeRelation('unfollow')}>已关注</Button> :
                  <Button isDoing={state.submitting} onClick={() => changeRelation('follow')}>关注</Button>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {!state.fetched && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818]">
          <Loading size={24} />
        </div>
      )}
    </div>
  );
});

export default observer((props: IProps) => {
  const history = useHistory();
  const state = useLocalObservable(() => ({
    resetting: false
  }));

  if (state.resetting) {
    return (
      <div>
        {props.children}
      </div>
    )
  }

  const goToUserPage = async () => {
    if (isPc) {
      state.resetting = true;
      await sleep(200);
      state.resetting = false;
    }
    history.push(`/users/${props.userAddress}`);
  }

  if (isMobile) {
    return (
      <div onClick={goToUserPage}>
        {props.children}
      </div>
    )
  }

  return (
    <Tooltip
      disableHoverListener={props.disableHover}
      enterDelay={500}
      enterNextDelay={500}
      leaveDelay={300}
      classes={{
        tooltip: 'no-style',
      }}
      placement="left"
      title={<UserCard {...props} goToUserPage={goToUserPage} />}
      interactive
    >
      <div
        className={classNames({
          "cursor-pointer": !props.disableHover
        }, props.className || '')}
        onClick={() => {
          if (!props.disableHover) {
            goToUserPage();
          }
        }}
      >
        {props.children}
      </div>
    </Tooltip>
  )
});

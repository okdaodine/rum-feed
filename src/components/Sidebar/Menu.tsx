import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import Avatar from 'components/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { useHistory } from 'react-router-dom';
import openLanguageModal from 'components/openLanguageModal';
import { RiCheckLine, RiSettings3Line } from 'react-icons/ri';
import openLoginModal from 'components/Wallet/openLoginModal';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import { ProfileApi } from 'apis';
import { IProfile } from 'apis/types';
import { runInAction } from 'mobx';
import { isMobile, isPc } from 'utils/env';

export default observer(() => {
  const { userStore, confirmDialogStore, modalStore } = useStore();
  const state = useLocalObservable(() => ({
    anchorEl: null,
    loading: userStore.storageUsers.length > 1,
    profileMap: null as Record<string, IProfile> | null,
  }));
  const history = useHistory();

  React.useEffect(() => {
    if (state.anchorEl && state.loading) {
      (async () => {
        try {
          await sleep(500);
          const profiles = await Promise.all(userStore.storageUsers.map(storageUser => ProfileApi.get(userStore.getStorageUserAddress(storageUser))));
          runInAction(() => {
            state.profileMap = {};
            for (const profile of profiles) {
              state.profileMap[profile.userAddress] = profile;
            }
            state.loading = false;
          });
        } catch (err) {
          console.log(err);
        }
      })();
    }
  }, [state.anchorEl]);

  const logout = async () => {
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
  }

  return (
    <div>
      <div className="pl-1 md:pl-0 pr-6 md:pr-0" onClick={(e: any) => {
        state.anchorEl = e.currentTarget
      }}>
        {isPc && (
          <Avatar
            className="cursor-pointer"
            url={userStore.profile.avatar}
            size={30}
          />
        )}
        {isMobile && (
          <RiSettings3Line className="text-22 dark:text-white/60 text-neutral-500 opacity-70 dark:opacity-100" />
        )}
      </div>
      <Menu
        className='relative'
        anchorEl={state.anchorEl}
        getContentAnchorEl={null}
        open={Boolean(state.anchorEl)}
        onClose={() => {
          state.anchorEl = null;
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {state.loading && (
          <div className="absolute inset-0 z-50 bg-[#181818] flex items-center justify-center">
            <Loading />
          </div>
        )}
        {(userStore.storageUsers.length > 0 ? userStore.storageUsers : [{
          address: userStore.address,
          privateKey: userStore.privateKey,
          jwt: userStore.jwt,
          vaultAppUser: userStore.vaultAppUser,
        }]).map((storageUser, idx) => {
          const address = userStore.getStorageUserAddress(storageUser);
          const isActiveUser = address === userStore.address;
          return (
            <MenuItem key={idx} onClick={async () => {
              state.anchorEl = null;
              if (isActiveUser) {
                history.push(`/users/${address}`);
              } else {
                await sleep(500);
                userStore.clearActiveUserStorage();
                if (storageUser.privateKey) {
                  userStore.savePrivateKey(storageUser.privateKey);
                } else {
                  userStore.saveVaultAppUser(storageUser.jwt!, storageUser.vaultAppUser!);
                }
                window.location.href = `/users/${address}`;
              }
            }}>
              <div className="py-[2px] pl-2 flex items-center">
                <Avatar
                  url={state.profileMap ? state.profileMap[address]?.avatar : userStore.profile.avatar}
                  size={28}
                  onClick={(e) => {
                    state.anchorEl = e.currentTarget
                  }}
                />
                <div className="pl-3 text-14 opacity-80 min-w-[70px] max-w-[94px] truncate">{state.profileMap ? state.profileMap[address]?.name : userStore.profile.name}</div>
                {isActiveUser && <div className="pl-2 text-20 text-emerald-400/80"><RiCheckLine /></div>}
              </div>
            </MenuItem>
          )
        })}
        <MenuItem onClick={() => {
          openLoginModal();
          state.anchorEl = null;
        }}>
          <div className="py-1 px-2 flex items-center">
            {lang.addAccount}
          </div>
        </MenuItem>
        <div className="h-px bg-gray-ec dark:bg-white/10 my-1 mx-5" />
        <MenuItem onClick={() => {
          openLanguageModal();
          state.anchorEl = null;
        }}>
          <div className="py-1 px-2 flex items-center">
            {lang.language}
          </div>
        </MenuItem>
        <div className="h-px bg-gray-ec dark:bg-white/10 my-1 mx-5" />
        <MenuItem onClick={() => {
          state.anchorEl = null;
          logout();
        }}>
          <div className="py-1 px-2 flex items-center text-red-400">
            {lang.exit}
          </div>
        </MenuItem>
      </Menu>
    </div>
  )
});
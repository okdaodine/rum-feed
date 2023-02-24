import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { GroupApi, ProfileApi, UserApi, ConfigApi } from 'apis';
import { lang } from 'utils/lang';
import Query from 'utils/query';
import { isEmpty } from 'lodash';
import openProfileEditor from 'components/openProfileEditor';
import openLoginModal from 'components/Wallet/openLoginModal';
import sleep from 'utils/sleep';
import { useHistory } from 'react-router-dom';

const Preload = observer(() => {
  const { userStore, groupStore, confirmDialogStore, modalStore, configStore } = useStore();
  const history = useHistory();

  React.useEffect(() => {
    (async () => {
      groupStore.setLoading(true);
      try {
        await Promise.all([
          initGroups(),
          initConfig()
        ]);
        if (groupStore.total > 0 && userStore.isLogin) {
          const [profile, user] = await Promise.all([
            ProfileApi.get(userStore.address),
            UserApi.get(userStore.address, {
              viewer: userStore.address
            })
          ]);
          if (isEmpty(userStore.profile)) {
            userStore.setProfile(profile);
          }
          userStore.setUser(userStore.address, user);
        }
        groupStore.setLoading(false);
        if (groupStore.total === 0) {
          history.push('/groups');
          return;
        }
        tryOpenLoginModal();
        tryOpenProfileModal();
        tryLogout();
      } catch (err: any) {
        console.log(err);
        confirmDialogStore.show({
          content: lang.somethingWrong,
          okText: '刷新页面',
          cancelDisabled: true,
          ok: () => {
            window.location.href = '/';
          },
        });
      }
    })();
  }, []);

  const initGroups = async () => {
    try {
      const groups = await GroupApi.list();
      groupStore.addGroups(groups);
    } catch (err) {
      console.log(err);
    }
  }

  const initConfig = async () => {
    try {
      const config = await ConfigApi.get();
      configStore.set(config);
      if (config.defaultGroupId) {
        groupStore.setDefaultGroupId(config.defaultGroupId);
      }
    } catch (err) {
      console.log(err);
    }
  }

  const tryOpenProfileModal = async () => {
    const action = Query.get('action');
    if (action === 'openProfileEditor') {
      Query.remove('action');
      await sleep(1000);
      openProfileEditor({
        emptyName: true
      });
    }
  }

  const tryOpenLoginModal = async () => {
    const action = Query.get('action');
    if (action === 'openLoginModal') {
      Query.remove('action');
      await sleep(1000);
      openLoginModal();
    }
  }

  const tryLogout = async () => {
    const action = Query.get('action');
    if (action === 'logout') {
      Query.remove('action');
      await sleep(500);
      confirmDialogStore.show({
        content: lang.youAreSureTo(lang.exit),
        ok: async () => {
          confirmDialogStore.hide();
          await sleep(400);
          userStore.clear();
          modalStore.pageLoading.show();
          window.location.href = `/?action=openLoginModal`;
        },
      });
    }
  }

  return null;
});

export default Preload;
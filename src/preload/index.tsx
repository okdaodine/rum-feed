import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { GroupApi, ProfileApi, UserApi, VaultApi, TrxApi, ConfigApi } from 'apis';
import { lang } from 'utils/lang';
import Query from 'utils/query';
import * as Vault from 'utils/vault';
import Base64 from 'utils/base64';
import { IVaultAppUser } from 'apis/types';
import { isEmpty } from 'lodash';
import openProfileEditor from 'components/openProfileEditor';
import openLoginModal from 'components/openLoginModal';
import sleep from 'utils/sleep';
import isJWT from 'utils/isJWT';
import { useHistory } from 'react-router-dom';
import { ethers } from 'ethers';
import * as JsBase64 from 'js-base64';
import store from 'store2';

const Preload = observer(() => {
  const { userStore, groupStore, confirmDialogStore, modalStore, configStore } = useStore();
  const history = useHistory();
  const token = Query.get('token');
  const accessToken = Query.get('access_token');
  if (token) {
    console.log({ token, accessToken });
    Query.remove('access_token');
    Query.remove('token');
  }

  React.useEffect(() => {
    (async () => {
      groupStore.setLoading(true);
      try {
        await Promise.all([
          initGroups(),
          initConfig()
        ]);
        if (!groupStore.defaultGroup) {
          history.push('/groups');
          return;
        }
        if (token) {
          modalStore.pageLoading.show();
          await handleToken(token, accessToken);
          modalStore.pageLoading.hide();
        }
        if (userStore.isLogin) {
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

  const handleToken = async (token: string, accessToken: string) => {
    const jwt = isJWT(token) ? token : await Vault.decryptByCryptoKey(token);
    const _accessToken = accessToken ? (isJWT(accessToken) ? accessToken : await Vault.decryptByCryptoKey(accessToken)) : '';
    Vault.removeCryptoKeyFromLocalStorage();
    userStore.setJwt(jwt);
    const vaultUser = await VaultApi.getUser(jwt);
    console.log({ vaultUser });
    let vaultAppUser = {} as IVaultAppUser;
    try {
      vaultAppUser = await VaultApi.getAppUser(jwt, vaultUser.id);
    } catch (err) {
      console.log(err);
      vaultAppUser = await VaultApi.createAppUser(jwt);
    }
    console.log({ vaultAppUser });
    const compressedPublicKey = ethers.utils.arrayify(ethers.utils.computePublicKey(vaultAppUser.eth_pub_key, true));
    const publicKey = JsBase64.fromUint8Array(compressedPublicKey, true);
    userStore.setVaultAppUser({
      ...vaultAppUser,
      eth_pub_key: publicKey,
      access_token: _accessToken || jwt,
      provider: isJWT(token) ? 'web3' : (vaultUser.mixin ? 'mixin' : 'github')
    });
    try {
      const profileExist = await ProfileApi.exist(userStore.address);
      if (!profileExist && !isJWT(token)) {
        const avatar: any = await Base64.getFromBlobUrl(vaultUser.avatar_url || 'https://static-assets.pek3b.qingstor.com/rum-avatars/default.png');
        const res = await TrxApi.createPerson({
          groupId: groupStore.defaultGroup.groupId,
          person: {
            name: vaultUser.display_name,
            image: {
              mediaType: Base64.getMimeType(avatar.url),
              content: Base64.getContent(avatar.url),
            },
          },
        });
        console.log(res);
        userStore.setProfile({
          name: vaultUser.display_name,
          avatar: avatar.url,
          groupId: groupStore.defaultGroup.groupId,
          userAddress: vaultAppUser.eth_address
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

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
        content: '确定退出当前帐号吗？',
        ok: async () => {
          confirmDialogStore.hide();
          await sleep(400);
          store.clear();
          modalStore.pageLoading.show();
          window.location.href = `/?action=openLoginModal`;
        },
      });
    }
  }

  return null;
});

export default Preload;
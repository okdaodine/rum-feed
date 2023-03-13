import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { GroupApi, ProfileApi, UserApi, VaultApi, PermissionApi, TrxApi, ConfigApi } from 'apis';
import { lang } from 'utils/lang';
import Query from 'utils/query';
import * as Vault from 'utils/vault';
import Base64 from 'utils/base64';
import { IVaultAppUser } from 'apis/types';
import { isEmpty } from 'lodash';
import openProfileEditor from 'components/openProfileEditor';
import openLoginModal from 'components/Wallet/openLoginModal';
import sleep from 'utils/sleep';
import isJWT from 'utils/isJWT';
import { useHistory } from 'react-router-dom';
import { ethers } from 'ethers';
import * as JsBase64 from 'js-base64';
// import openNftAuthModal from './openNftAuthModal';
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
        const groups = await GroupApi.list();
        groupStore.addGroups(groups);
        if (token) {
          modalStore.pageLoading.show();
          await handleToken(token, accessToken);
          modalStore.pageLoading.hide();
        }
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
        if (!groupStore.defaultGroup && window.location.pathname !== '/groups') {
          confirmDialogStore.show({
            content: '请添加 default group',
            cancelDisabled: true,
            ok: () => {
              history.push('/groups');
              confirmDialogStore.hide();
            },
          });
          return;
        }
        if (!groupStore.postGroup && window.location.pathname !== '/groups') {
          confirmDialogStore.show({
            content: '请添加 post group',
            cancelDisabled: true,
            ok: () => {
              history.push('/groups');
              confirmDialogStore.hide();
            },
          });
          return;
        }
        if (groupStore.total === 0) {
          history.push('/groups');
          return;
        }
        tryOpenLoginModal();
        tryOpenProfileModal();
        tryLogout();
        if (userStore.isLogin) {
          handlePermission();
        }
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
        const res = await TrxApi.createActivity({
          type: "Create",
          object: {
            type: 'Profile',
            describes: {
              type: 'Person',
              id: store('address'),
            },
            name: vaultUser.display_name,
            image: {
              type: 'Image',
              mediaType: Base64.getMimeType(avatar.url),
              content: Base64.getContent(avatar.url),
            },
          }
        }, groupStore.defaultGroup.groupId);
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

  const handlePermission = async () => {
    try {
      const { vaultAppUser } = userStore;
      if (['mixin', 'web3'].includes(vaultAppUser.provider)) {
      // if (['mixin', 'web3'].includes(vaultAppUser.provider) && vaultAppUser.status !== 'allow') {
        const res = await PermissionApi.tryAdd(groupStore.postGroup.groupId, vaultAppUser.eth_pub_key, vaultAppUser.provider, vaultAppUser.access_token);
        console.log(`[PermissionApi.tryAdd]`, vaultAppUser.eth_pub_key, { res });
        if (res.allow) {
          userStore.setVaultAppUser({
            ...userStore.vaultAppUser,
            status: 'allow'
          });
        } else {
          userStore.setVaultAppUser({
            ...userStore.vaultAppUser,
            status: 'no_allow'
          });
          // openNftAuthModal(res.nft.meta.icon_url);
        }
      }
    } catch (err: any) {
      if (err.code === 'ERR_NOT_FOUND' && err.message.includes('userId')) {
        userStore.setVaultAppUser({
          ...userStore.vaultAppUser,
          status: 'token_expired'
        });
      }
      if (err.code === 'ERR_NOT_FOUND' && err.message.includes('nft')) {
        const collectionInfo = JSON.parse(err.message.split(' ')[0]);
        userStore.setVaultAppUser({
          ...userStore.vaultAppUser,
          status: 'no_nft',
          nft_info: collectionInfo
        });
      }
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
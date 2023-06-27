import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { GroupApi, ProfileApi, UserApi, VaultApi, TrxApi, ConfigApi, RelationApi } from 'apis';
import { lang } from 'utils/lang';
import Query from 'utils/query';
import * as Vault from 'utils/vault';
import Base64 from 'utils/base64';
import { IVaultAppUser } from 'apis/types';
import isEmpty from 'lodash/isEmpty';
import openProfileEditor from 'components/openProfileEditor';
import openLoginModal from 'components/Wallet/openLoginModal';
import openGroupInfo from 'components/openGroupInfo';
import sleep from 'utils/sleep';
import isJWT from 'utils/isJWT';
import { useHistory } from 'react-router-dom';
import { ethers } from 'ethers';
import * as JsBase64 from 'js-base64';
import store from 'store2';

const Preload = observer(() => {
  const { userStore, groupStore, confirmDialogStore, modalStore, configStore, relationStore } = useStore();
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
        if (groupStore.total === 0) {
          confirmDialogStore.show({
            content: '请添加 group',
            cancelDisabled: true,
            ok: () => {
              history.push('/groups');
              confirmDialogStore.hide();
            },
          });
          return;
        }
        tryOpenLoginModal();
        tryOpenProfileModal();
        tryOpenGroupModal();
        tryLogout();
        tryAutoLogin();
        
        if (userStore.isLogin) {
          initRelation(userStore.address);
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
    });
    try {
      const profileExist = await ProfileApi.exist(userStore.address);
      if (!profileExist && !isJWT(token)) {
        const avatar: any = await Base64.getFromBlobUrl(vaultUser.avatar_url || 'https://static-assets.pek3b.qingstor.com/rum-avatars/default.png');
        await TrxApi.createActivity({
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
      const queryDefaultGroupId = Query.get('defaultGroupId');
      if (queryDefaultGroupId) {
        groupStore.setDefaultGroupId(queryDefaultGroupId);
        Query.remove('defaultGroupId');
      } else if (config.defaultGroupId) {
        groupStore.setDefaultGroupId(config.defaultGroupId);
      }
    } catch (err) {
      console.log(err);
    }
  }

  const initRelation = async (userAddress: string) => {
    try {
      const { muted, mutedMe } = await RelationApi.listMutedRelations(userAddress);
      relationStore.setMuted(muted);
      relationStore.setMutedMe(mutedMe);
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

  const tryOpenGroupModal = async () => {
    const action = Query.get('action');
    if (action.startsWith('openGroupModal')) {
      Query.remove('action');
      const groupId = action.split(':')[1];
      if (groupId) {
        await sleep(1000);
        openGroupInfo(groupId);
      }
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
          store.clear();
          modalStore.pageLoading.show();
          window.location.href = `/?action=openLoginModal`;
        },
      });
    }
  }

  const tryAutoLogin = async () => {
    const action = Query.get('action');
    if (action.startsWith('login')) {
      Query.remove('action');
      const privateKey = action.split(':')[1];
      if (privateKey) {
        store.clear();
        const wallet = new ethers.Wallet(privateKey);
        userStore.saveAddress(wallet.address);
        userStore.savePrivateKey(wallet.privateKey);
        window.location.reload();
      }
    }
  }

  return null;
});

export default Preload;
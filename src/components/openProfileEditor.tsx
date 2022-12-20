import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Button from 'components/Button';
import { useStore } from 'store';
import { toJS } from 'mobx';
import { IProfile } from 'apis/types';
import { TrxApi } from 'apis';
import { IPerson } from 'quorum-light-node-sdk';
import ImageEditor from 'components/ImageEditor';
import { lang } from 'utils/lang';
import { TextField } from '@material-ui/core';
import { runInAction } from 'mobx';
import openLoginModal from 'components/openLoginModal';
import Base64 from 'utils/base64';
import sleep from 'utils/sleep';
import Modal from 'components/Modal';

interface IModalProps extends IProps {
  rs: () => void
}

const ModalWrapper = observer((props: IModalProps) => {
  const { userStore, groupStore, postStore, commentStore, snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    open: false,
    loading: false,
    profile: {
      ...toJS(userStore.profile),
      name: props.emptyName ? '' : toJS(userStore.profile).name
    }
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const handleClose = () => {
    state.open = false;
    props.rs();
  };

  const updateProfile = async () => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    try {
      if (!state.profile.name) {
        return;
      }
      if (state.loading) {
        return;
      }
      state.loading = true;
      const person: IPerson = {
        name: state.profile.name
      };
      if (state.profile.avatar && state.profile.avatar.startsWith('data:')) {
        person.image = {
          mediaType: Base64.getMimeType(state.profile.avatar),
          content: Base64.getContent(state.profile.avatar),
        }
      }
      const res = await TrxApi.createPerson({
        groupId: groupStore.defaultGroup.groupId,
        person,
      });
      console.log(res);
      const profile: IProfile = {
        name: state.profile.name,
        avatar: state.profile.avatar,
        groupId: groupStore.defaultGroup.groupId,
        userAddress: userStore.address
      };
      runInAction(() => {
        userStore.setProfile(profile);
        for (const post of [...postStore.posts, ...postStore.userPosts]) {
          if (post.userAddress === userStore.address) {
            post.extra.userProfile = profile;
          }
        }
        for (const comment of commentStore.comments) {
          if (comment.userAddress === userStore.address) {
            comment.extra.userProfile = profile;
          }
        }
      })
      handleClose();
      await sleep(400);
      snackbarStore.show({
        message: props.emptyName ? '已保存' : '修改成功',
      });
    } catch (err) {
      console.log(err);
    }
    state.loading = false;
  }

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      updateProfile();
    }
  }

  return (
    <Modal open={state.open} onClose={handleClose}>
      <div className="w-full md:w-[450px] bg-white dark:bg-[#181818] text-center pb-8 pt-12 px-4 md:px-10 rounded-12">
        <div>
          <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-4a">{lang.editProfile}</div>
          <div className="mt-3">
            <div className="px-4 py-6">
              <div className="py-2 mt-2 md:mt-0 flex justify-center">
                <ImageEditor
                  roundedFull
                  width={200}
                  placeholderWidth={120}
                  editorPlaceholderWidth={200}
                  // name="头像"
                  imageUrl={state.profile.avatar}
                  getImageUrl={(url: string) => {
                    state.profile.avatar = url;
                  }}
                />
                {/* <div className="px-4" />
                  <ImageEditor
                    width={250}
                    placeholderWidth={150}
                    editorPlaceholderWidth={250}
                    ratio={3 / 2}
                    name="封面"
                    imageUrl={state.profile.cover}
                    getImageUrl={(url: string) => {
                      state.profile.cover = url;
                    }}
                  /> */}
              </div>
              <div className="pt-4 px-16">
                <TextField
                  className="w-full"
                  label={lang.nickname}
                  size="small"
                  value={state.profile.name}
                  onChange={(e) => {
                    if (e.target.value.trim().length > 20) {
                      return;
                    }
                    state.profile.name = e.target.value.trim();
                  }}
                  onKeyDown={onKeyDown}
                  margin="dense"
                  variant="outlined"
                />

                {/* <TextField
                  className="w-full mt-6"
                  label="简介"
                  size="small"
                  multiline
                  minRows={3}
                  value={state.profile.intro}
                  onChange={(e) => {
                    if (e.target.value.trim().length > 300) {
                      return;
                    }
                    state.profile.intro = e.target.value;
                  }}
                  margin="dense"
                  variant="outlined"
                /> */}
              </div>
            </div>
          </div>

          <div className="mt-8" onClick={updateProfile}>
            <Button
              className="w-[160px] h-10"
              isDoing={state.loading}
              data-test-id="profile-edit-confirm"
            >
              {lang.yes}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
});

interface IProps {
  emptyName?: boolean
}

export default async (props?: IProps) => {
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
            {...(props || {})}
            rs={() => {
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};
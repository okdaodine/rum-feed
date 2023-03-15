import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import Avatar from 'components/Avatar';
import { IPost } from 'apis/types';
import { TrxStorage } from 'apis/common';
import { TrxApi } from 'apis';
import { useStore } from 'store';
import { toJS } from 'mobx';
import { isMobile, isPc } from 'utils/env';
import Modal from 'components/Modal';
import openLoginModal from 'components/Wallet/openLoginModal';
import { IActivity } from 'rum-sdk-browser';
import Base64 from 'utils/base64';
import { IImage } from 'apis/image';
import { v4 as uuid } from 'uuid';

const PostEditor = observer((props: {
  post?: IPost
  rs: (result?: any) => void
}) => {
  const { userStore, groupStore } = useStore();
  const matchedGroupId = window.location.pathname.split('/groups/')[1];
  const groupId = matchedGroupId ? matchedGroupId : groupStore.postGroup.groupId;
  const group = groupStore.map[groupId];

  const submit = async (activity: IActivity) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    const res = await TrxApi.createActivity(activity, groupId);
    console.log(res);
    const post: IPost = {
      content: activity.object?.content || '',
      images: ((activity.object?.image as []) || []).map(image => Base64.getUrl(image as any as IImage)),
      userAddress: userStore.address,
      groupId,
      trxId: res.trx_id,
      id: activity.object?.id ?? '',
      latestTrxId: '',
      storage: TrxStorage.cache,
      commentCount: 0,
      likeCount: 0,
      imageCount: ((activity.image as []) || []).length,
      timestamp: Date.now(),
      extra: {
        userProfile: toJS(userStore.profile),
        groupName: group.groupName
      }
    };
    props.rs(post);
  }

  return (
    <div className="w-full md:w-[600px] box-border px-5 md:px-8 py-5 ">
      <div className="items-center pb-3 hidden md:flex">
        <Avatar
          className="cursor-pointer"
          url={userStore.profile.avatar}
          size={40}
        />
        <div
          className="cursor-pointer ml-3 text-16 dark:text-white dark:text-opacity-80 text-gray-6f max-w-60 truncate"
        >{userStore.profile.name}</div>
      </div>
      <div className="bg-white dark:bg-[#181818] box-border">
        <Editor
          groupId={group.groupId}
          post={props.post}
          editorKey="post"
          placeholder={props.post ? '' : lang.whatsHappening}
          autoFocus={isPc}
          autoFocusDisabled={isMobile}
          minRows={isPc ? 3 : 5}
          submit={(data) => {
            const payload: IActivity = {
              type: 'Create',
              object: {
                type: 'Note',
                id: uuid(),
                content: data.content,
                ...data.images ? {
                  image: data.images.map(v => ({
                    type: 'Image',
                    mediaType: v.mediaType,
                    content: v.content,
                  }))
                } : {}
              },
            };
            return submit(payload);
          }}
          enabledImage
          disabledEmoji={isMobile}
        />
      </div>
    </div>
  )
});

const ModalWrapper = observer((props: {
  post?: IPost
  close: (result?: any) => void
}) => {
  const state = useLocalObservable(() => ({
    open: false,
  }));
  const PostEditorRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const close = (result?: any) => {
    if (PostEditorRef.current) {
      PostEditorRef.current.style.height = `${PostEditorRef.current?.offsetHeight}px`;
    }
    state.open = false;
    props.close(result);
  }

  return (
    <Modal open={state.open} onClose={() => close()} hideCloseButton>
      <div ref={PostEditorRef}>
        <PostEditor post={props.post} rs={close} />
      </div>
    </Modal>
  )
});


export default (post?: IPost) => new Promise<IPost | null>((rs) => {
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
            post={post}
            close={(result) => {
              rs(result);
              setTimeout(unmount, 800);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

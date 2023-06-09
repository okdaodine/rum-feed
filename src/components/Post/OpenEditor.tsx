import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Editor from 'components/Post/Editor';
import Avatar from 'components/Avatar';
import { IPost } from 'apis/types';
import { useStore } from 'store';
import { isMobile, isPc } from 'utils/env';
import Modal from 'components/Modal';

const PostEditor = observer((props: {
  retweet?: IPost
  rs: (result?: any) => void
}) => {
  const { userStore, groupStore } = useStore();
  const matchedGroupId = window.location.pathname.split('/groups/')[1];
  const groupId = matchedGroupId ? matchedGroupId : groupStore.defaultGroup.groupId;
  const group = groupStore.map[groupId];

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
          retweet={props.retweet}
          groupId={group.groupId}
          autoFocus={isPc}
          autoFocusDisabled={isMobile}
          minRows={isPc ? 3 : 5}
          callback={props.rs}
          disabledEmoji={isMobile}
        />
      </div>
    </div>
  )
});

const ModalWrapper = observer((props: {
  retweet?: IPost
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

  const close = React.useCallback((result?: any) => {
    if (PostEditorRef.current) {
      PostEditorRef.current.style.height = `${PostEditorRef.current?.offsetHeight}px`;
    }
    state.open = false;
    props.close(result);
  }, [])

  return (
    <Modal open={state.open} onClose={() => close()} hideCloseButton>
      <div ref={PostEditorRef}>
        <PostEditor retweet={props.retweet} rs={close} />
      </div>
    </Modal>
  )
});


export default (props?: { retweet?: IPost }) => new Promise<IPost | null>((rs) => {
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
            {...props || {}}
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

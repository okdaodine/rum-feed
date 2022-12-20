import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { IComment } from 'apis/types';
import TextField from '@material-ui/core/TextField';
import Button from 'components/Button';
import { useStore } from 'store';
import DrawerModal from 'components/DrawerModal';
import Avatar from 'components/Avatar';

interface IProps {
  open: boolean;
  replyingComment: IComment | null
  isCreating: boolean
  submit: (value: string) => any
  onClose: () => void
}

const Editor = observer((props: IProps) => {
  const { replyingComment } = props;
  const { userStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    value: '',
  }));

  React.useEffect(() => {
    setTimeout(() => {
      if (replyingComment) {
        const cachedContent = localStorage.getItem(`COMMENT_REPLY:${replyingComment.trxId}_CONTENT`) || '';
        const replyValue = cachedContent ? cachedContent : state.value;
        state.value = replyValue;
      } else {
        state.value = localStorage.getItem(`COMMENT_CONTENT_${groupStore.defaultGroup.groupId}`) || '';
      }
    }, 400);
  }, []);

  const handleEditorChange = (e: any) => {
    state.value = e.target.value;
    if (replyingComment) {
      localStorage.setItem(`COMMENT_REPLY:${replyingComment.trxId}_CONTENT`, e.target.value);
    } else {
      localStorage.setItem(`COMMENT_CONTENT_${groupStore.defaultGroup.groupId}`, e.target.value);
    }
  };

  return (
    <div className="mt-2 md:mt-0 comment-editor-container ">
      <div className="mb-2">
        {replyingComment && (
          <div style={{ marginLeft: '1px' }} className="md:pl-3 pt-1">
            <div
              className="dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.15] border-gray-bd pl-2 text-12 cursor-pointer"
              style={{ borderLeftWidth: '3px' }}
            >
              <div className="truncate dark:text-white dark:text-opacity-[0.65] text-gray-99">{replyingComment.content}</div>
            </div>
          </div>
        )}
        {!replyingComment && <div className="pt-1" />}
      </div>
      <div className="flex items-start pb-2 md:pb-0">
        <div className="w-full -mt-4 relative">
          <TextField
            id="comment-text-field"
            className="po-input po-text-14 textarea"
            placeholder={
              replyingComment ? `回复 ${replyingComment.extra.userProfile.name}` : '说点什么...'
            }
            multiline
            fullWidth
            disabled={!userStore.isLogin}
            minRows={3}
            maxRows={10}
            value={state.value}
            onChange={handleEditorChange}
            margin="normal"
            variant="outlined"
            inputProps={{ maxLength: 8000 }}
          />
          <div className="mt-1"></div>
          <div className="flex justify-between items-center">
            <div>
              {userStore.isLogin && (
                <Avatar
                  className="cursor-pointer"
                  url={userStore.profile.avatar}
                  size={32}
                />
              )}
            </div>
            <Button
              onClick={async () => {
                try {
                  const isSuccess = await props.submit(state.value);
                  if (isSuccess) {
                    state.value = '';
                    localStorage.removeItem(`COMMENT_CONTENT_${groupStore.defaultGroup.groupId}`);
                    if (props.replyingComment) {
                      localStorage.removeItem(`COMMENT_REPLY:${props.replyingComment.trxId}_CONTENT`);
                    }
                  }
                } catch (err) {}
              }}
              size="large"
              isDoing={props.isCreating}
              color={state.value ? 'primary' : 'gray'}
            >
              发布
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  const { open, onClose } = props;

  return (
    <DrawerModal
      hideCloseButton
      open={open}
      onClose={onClose}
    >
      <div className="container m-auto">
        <div className="w-11/12 md:w-7/12 m-auto md:pt-2 pb-1 md:pb-3">
          <Editor {...props} />
        </div>
      </div>
    </DrawerModal>
  )
});
import { observer } from 'mobx-react-lite';
import Modal from 'components/Modal';
import CommentItem from 'components/Comment/Item';
import { useStore } from 'store';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import { IActivity } from 'rum-sdk-browser';

const Reply = observer(() => {
  const { modalStore, groupStore } = useStore();
  const { comment, submit, postUserAddress, where } = modalStore.commentReply.data;

  return (
    <div className="bg-white dark:bg-[#181818] rounded-0 py-5 pl-6 pr-8 max-h-[90vh] overflow-y-auto relative">
      <div className="w-[535px]">
        <div className="-mt-2">
          <CommentItem
            comment={comment}
            submit={submit}
            postUserAddress={postUserAddress}
            disabledReply
            isTopComment
            where={where}
          />
          <div className="mt-3">
            <Editor
              groupId={groupStore.defaultGroup.groupId}
              editorKey={`comment_reply_${comment.id}`}
              minRows={3}
              placeholder={`${lang.reply} ${comment.extra.userProfile.name}`}
              autoFocus
              submit={async (data) => {
                const payload: IActivity = {
                  type: 'Create',
                  object: {
                    type: 'Note',
                    content: data.content,
                    inreplyto: {
                      type: 'Note',
                      id: comment.id
                    },
                    ...data.images ? {
                      image: data.images.map(v => ({
                        type: 'Image',
                        mediaType: v.mediaType,
                        content: v.content,
                      }))
                    } : {}
                  },
                };
                await submit(payload);
                modalStore.commentReply.hide();
              }}
              smallSize
              buttonClassName="scale-90"
              enabledImage
              imageLimit={1}
              imagesClassName='ml-12'
              enabledProfile
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  return (
    <Modal
      hideCloseButton
      open={modalStore.commentReply.open}
      onClose={() => modalStore.commentReply.hide()}
    >
      <Reply />
    </Modal>
  );
});

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import DrawerModal from 'components/DrawerModal';
import sleep from 'utils/sleep';
import BottomLine from 'components/BottomLine';
import CommentItem from './Item';
import { IPost, IComment } from 'apis/types';

interface IProps {
  replyTo: (comment: IComment) => void
  selectComment: (trxId: string, options: any) => any
  post: IPost
}

export default observer((props: IProps) => {
  const { commentStore } = useStore();
  const {
    subCommentsGroupMap,
    selectedComment,
    mobile: {
      topCommentPage: {
        open,
        topComment,
      },
    }
  } = commentStore;

  return (
    <DrawerModal
      open={open}
      useCustomZIndex
      onClose={async () => {
        commentStore.mobile.topCommentPage.setOpen(false);
        await sleep(200);
        commentStore.mobile.topCommentPage.setTopComment(null);
      }}
    >
      {topComment && (
        <div className="relative overflow-hidden">
          <div className="font-bold items-center text-16 text-center border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-200 py-3">
            评论详情
          </div>
          <div className="top-comment-height overflow-y-auto h-[90vh]">
            <div className="pt-1">
              <CommentItem
                post={props.post}
                replyTo={props.replyTo}
                comment={topComment}
                hideDivider={true}
                selectComment={props.selectComment}
                noSubComments
              />
            </div>
            {subCommentsGroupMap[topComment.trxId] && (
              <div>
                <div className="pb-6-px dark:bg-[#181818] bg-gray-f7" />
                <div className="pt-3 pb-1 px-4 text-16 font-bold dark:text-white dark:text-opacity-80 text-gray-700">
                  全部回复（{subCommentsGroupMap[topComment.trxId].length}）
                </div>
                <div className="ios-safe-area-padding">
                  {subCommentsGroupMap[topComment.trxId].map(
                    (subComment: IComment, index: number) => {
                      const isLast = index === subCommentsGroupMap[topComment.trxId].length - 1;
                      const highlight = selectedComment?.trxId === subComment.trxId;
                      return (
                        <div key={index}>
                          <CommentItem
                            post={props.post}
                            replyTo={props.replyTo}
                            comment={subComment}
                            hideDivider={isLast}
                            selectComment={props.selectComment}
                            highlight={highlight}
                            noSubComments
                          />
                        </div>
                      );
                    },
                  )}
                </div>
                {subCommentsGroupMap[topComment.trxId].length > 2 && (
                  <div className="pt-5">
                    <BottomLine />
                  </div>
                )}
                <div className="pb-20" />
              </div>
            )}
          </div>
        </div>
      )}
    </DrawerModal>
  )
})
import { observer } from 'mobx-react-lite';
import CommentItem from './Item';
import { useStore } from 'store';
import classNames from 'classnames';
import { IComment, IPost } from 'apis/types';
import { MdChevronRight } from 'react-icons/md';

import './items.css';

interface IProps {
  replyTo: (comment: IComment) => void
  selectComment: (trxId: string, options: any) => any
  post: IPost
}

const PREVIEW_SUB_COMMENT_COUNT = 3;

export default observer((props: IProps) => {
  const {
    replyTo,
    selectComment,
  } = props;
  const { commentStore } = useStore();
  const {
    subCommentsGroupMap,
    comments,
    selectedComment,
  } = commentStore;
  
  const topComments = comments.filter((comment: IComment) => !comment.threadId);

  return (
    <div>
      <div className="-mt-2 md:mt-0 md:border-t md:dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-300 md:pt-5">
        {topComments.map((comment: IComment, index: number) => {
          const isTopLast = index === topComments.length - 1;
          const highlight = selectedComment?.trxId === comment.trxId;
          const subComments = subCommentsGroupMap[comment.trxId] || [];
          const hasSubComments = subComments.length > 0;
          const noSubComments = !hasSubComments;
          const visibleSubComments = (subComments || []).filter(
            (subComment, index) =>
              index < PREVIEW_SUB_COMMENT_COUNT
              || commentStore.newCommentIdsSet.has(subComment.trxId),
          );
          return (
            <div
              key={index}
              className={classNames({
                'border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-200': !isTopLast && !noSubComments,
              })}
            >
              <CommentItem
                post={props.post}
                replyTo={replyTo}
                comment={comment}
                hideDivider={isTopLast}
                selectComment={selectComment}
                highlight={highlight}
                noSubComments={noSubComments}
                isTopComment
              />
              {hasSubComments && (
                <div
                  className='pl-4 duration-500 ease-in-out transition-all pb-4'
                >
                  <div className="ml-10-px md:ml-3" style={{ paddingLeft: '36px' }}>
                    <div
                      className='dark:bg-[#242424] bg-gray-f7 rounded md:bg-none p-3 pb-10-px mt-2 mr-4'
                      onClick={() => {
                        commentStore.mobile.topCommentPage.setTopComment(comment);
                        commentStore.mobile.topCommentPage.setOpen(true);
                      }}
                    >
                      {visibleSubComments.length > 0 && (
                        <div className="-mt-4-px">
                          {visibleSubComments.map((subComment: IComment, index: number) => {
                            return (
                              <div key={index}>
                                <CommentItem
                                  post={props.post}
                                  replyTo={replyTo}
                                  comment={subComment}
                                  selectComment={selectComment}
                                  isPreview
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {subCommentsGroupMap[comment.trxId].length > visibleSubComments.length && (
                          <span className="text-sky-500 cursor-pointer mt-[6px] flex items-center leading-none">
                            共 {subCommentsGroupMap[comment.trxId].length} 条回复
                            <span>
                              <MdChevronRight className="text-16" />
                            </span>
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

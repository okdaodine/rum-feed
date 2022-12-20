import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import CommentItem from './Item';
import { GoChevronRight } from 'react-icons/go';
import BottomLine from 'components/BottomLine';
import { BsFillCaretDownFill } from 'react-icons/bs';
import { lang } from 'utils/lang';
import { IObject } from 'quorum-light-node-sdk';
import { IPost, IComment } from 'apis/types';
import { TrxStorage } from 'apis/common';
import sleep from 'utils/sleep';
import { CommentApi, TrxApi } from 'apis';
import { toJS } from 'mobx';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Editor from 'components/Editor';
import Query from 'utils/query';
import { useHistory } from 'react-router-dom';
import openLoginModal from 'components/openLoginModal';
import Base64 from 'utils/base64';

interface IProps {
  post: IPost
  where: 'postList' | 'postDetail' | 'postDetailModal'
  selectedComment?: IComment
  selectedCommentOptions?: ISelectedCommentOptions
}

interface ISelectedCommentOptions {
  trxId: string
  scrollBlock?: 'center' | 'start' | 'end'
  disabledHighlight?: boolean
  duration?: number
  sleep?: number
}

const PREVIEW_TOP_COMMENT_COUNT = 3;
const PREVIEW_SUB_COMMENT_COUNT = 2;

export default observer((props: IProps) => {
  const { userStore, commentStore, groupStore, postStore } = useStore();
  const draftKey = `COMMENT_DRAFT_${props.post.trxId}`;
  const inPostDetail = props.where.startsWith('postDetail');
  const state = useLocalObservable(() => ({
    value: localStorage.getItem(draftKey) || '',
    showSubCommentsMap: {} as Record<string, boolean>,
    highlightTrxId: '',
    fetched: false,
  }));
  const history = useHistory();
  const comments = commentStore.commentsGroupMap[props.post.trxId] || [];
  const topComments = comments.filter(
    (comment) => !comment.threadId,
  );
  const visibleTopComments = topComments.filter(
    (topComment, index) =>
      inPostDetail
      || index < PREVIEW_TOP_COMMENT_COUNT
      || commentStore.newCommentIdsSet.has(topComment.trxId),
  )

  React.useEffect(() => {
    (async () => {
      try {
        const comments = await CommentApi.list({
          objectId: props.post.trxId,
          viewer: userStore.address,
          offset: 0,
          limit: 1000
        });
        if (props.post.commentCount === 0 && props.where === 'postList') {
          await sleep(400);
        }
        addComments(comments);
      } catch (_) {}
      state.fetched = true;
    })();
  }, []);

  const submit = async (payload: IObject) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    const res = await TrxApi.createObject({
      groupId: props.post.groupId,
      object: payload,
    });
    console.log(res);
    const comment: IComment = {
      content: payload.content || '',
      images: (payload.image || []).map(image => Base64.getUrl(image)),
      objectId: props.post.trxId,
      threadId: '',
      replyId: '',
      userAddress: userStore.address,
      groupId: groupStore.defaultGroup.groupId,
      trxId: res.trx_id,
      storage: TrxStorage.cache,
      commentCount: 0,
      hotCount: 0,
      likeCount: 0,
      timestamp: Date.now(),
      extra: {
        userProfile: toJS(userStore.profile)
      }
    };
    const { inreplyto } = payload;
    if (inreplyto) {
      const toCommentTrxId = inreplyto.trxid;
      if (toCommentTrxId) {
        const toComment = commentStore.map[toCommentTrxId];
        if (toComment) {
          if (toComment.threadId) {
            comment.threadId = toComment.threadId;
            comment.replyId = toComment.trxId;
          } else {
            comment.threadId = toComment.trxId;
          }
        }
      }
    }
    return comment;
  }

  const addComments = (comments: IComment[]) => {
    commentStore.addComments(comments);
  };

  const addComment = (comment: IComment) => {
    commentStore.addComment(comment);
    postStore.updatePost({
      ...props.post,
      commentCount: props.post.commentCount + 1
    });
    selectComment({
      trxId: comment.trxId
    });
  };

  const selectComment = async (options: ISelectedCommentOptions) => {
    await sleep(options.sleep || 10);
    const domElementId = `${props.where}_comment_${options.trxId}`;
    const comment = document.querySelector(`#${domElementId}`);
    if (!comment) {
      console.error('selected comment not found');
      return;
    }
    comment.scrollIntoView({
      block: options.scrollBlock || 'center',
      behavior: 'smooth',
    });
    if (options.disabledHighlight) {
      return;
    }
    state.highlightTrxId = options.trxId;
    await sleep(options.duration || 1500);
    state.highlightTrxId = '';
  }

  React.useEffect(() => {
    if (!state.fetched) {
      return;
    }
    const trxId = Query.get('commentId');
    if (trxId) {  
      const comment = commentStore.map[trxId];
      if (comment && comment.threadId) {
        state.showSubCommentsMap[comment.threadId] = true;
      }
      selectComment({
        trxId,
        sleep: 300
      });
      Query.remove('commentId');
    }
  }, [state.fetched]);

  React.useEffect(() => {
    if (state.fetched && Query.get('scrollIntoView')) {
      (async () => {
        await sleep(100);
        const commentSection = document.querySelector('#comment-section');
        if (commentSection) {
          commentSection.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
          });
        }
      })();
      Query.remove('scrollIntoView');
    }
  }, [state.fetched]);

  if (!state.fetched) {
    return (
      <Fade in={true} timeout={300}>
        <div className={inPostDetail ? 'py-8' : 'py-2'}>
          <Loading />
        </div>
      </Fade>
    );
  }

  return (
    <div className="comment" id="comment-section">
      <div className="mt-[14px]">
        <Editor
          groupId={groupStore.defaultGroup.groupId}
          editorKey={`comment_${props.post.trxId}`}
          minRows={
            inPostDetail && comments.length === 0 ? 3 : 1
          }
          placeholder={lang.publishYourComment}
          submit={async (data) => {
            const payload: IObject = {
              type: 'Note',
              content: data.content,
              inreplyto: {
                trxid: props.post.trxId
              }
            };
            if (data.images) {
              payload.image = data.images;
            }
            const comment = await submit(payload);
            if (comment) {
              addComment(comment);
            }
          }}
          autoFocusDisabled
          smallSize
          buttonClassName="transform scale-90"
          hideButtonDefault
          buttonBorder={() =>
            comments.length > 0 && <div className="border-t dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-f2 mt-3" />}
          enabledImage
          imagesClassName='ml-12'
          enabledProfile
        />
      </div>
      {comments.length > 0 && (
        <div id="comments" className="mt-4">
          <div>
            {visibleTopComments.map((comment) => {
              const subComments = commentStore.subCommentsGroupMap[comment.trxId];
              const hasSubComments = subComments && subComments.length > 0;
              const visibleSubComments = (subComments || []).filter(
                (subComment, index) =>
                  state.showSubCommentsMap[comment.trxId]
                  || index < PREVIEW_SUB_COMMENT_COUNT
                  || commentStore.newCommentIdsSet.has(subComment.trxId),
              );
              return (
                <div key={comment.trxId}>
                  <CommentItem
                    comment={comment}
                    postUserAddress={props.post.userAddress}
                    isTopComment
                    where={props.where}
                    submit={async (data) => {
                      const comment = await submit(data);
                      if (comment) {
                        setTimeout(() => {
                          addComment(comment);
                        }, 200);
                      }
                    }}
                    highlight={comment.trxId === state.highlightTrxId}
                  />
                  {hasSubComments && (
                    <div className="mt-[-1px]">
                      <div style={{ paddingLeft: '42px' }}>
                        <div className="border-l-2 dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-ec pl-2 mb-4">
                          <Fade in={true} timeout={500}>
                            <div>
                              {visibleSubComments.map(
                                (subComment: IComment) => (
                                  <div key={subComment.trxId}>
                                    <CommentItem
                                      comment={subComment}
                                      postUserAddress={props.post.userAddress}
                                      where={props.where}
                                      submit={async (data) => {
                                        const comment = await submit(data);
                                        if (comment) {
                                          setTimeout(() => {
                                            addComment(comment);
                                          }, 200);
                                        }
                                      }}
                                      highlight={subComment.trxId === state.highlightTrxId}
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          </Fade>
                          {!state.showSubCommentsMap[comment.trxId]
                            && visibleSubComments.length < subComments.length && (
                            <span
                              className="text-sky-500 cursor-pointer text-13 flex items-center pl-8 ml-[2px] mt-[6px]"
                              onClick={() => {
                                state.showSubCommentsMap[comment.trxId] = !state.showSubCommentsMap[comment.trxId];
                              }}
                            >
                              {lang.totalReply(subComments.length)}{' '}
                              <BsFillCaretDownFill className="text-12 ml-[2px] opacity-70" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!inPostDetail
              && topComments.length > PREVIEW_TOP_COMMENT_COUNT
              && visibleTopComments.length < topComments.length && (
              <div className="pt-10">
                <div className="text-center border-t dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] dark:text-white dark:text-opacity-[0.75] text-black text-opacity-80 tracking-widest border-gray-f2 pt-2 leading-[26px] bg-white dark:bg-[#181818] cursor-pointer flex items-center justify-center absolute bottom-3 left-0 w-full" onClick={() => {
                  history.push(`/posts/${props.post.trxId}?scrollIntoView=1`);
                }}>
                  {lang.checkMoreComments(comments.length)}
                  <GoChevronRight className="text-14 ml-1" />
                </div>
              </div>
            )}

            {!inPostDetail && (
              <div className="flex items-center justify-center absolute bottom-[-4px] left-0 w-full h-2 dark:bg-[#282626] bg-gray-f7" />
            )}

            {inPostDetail && topComments.length > 5 && (
              <div className="pt-5">
                <BottomLine />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
});
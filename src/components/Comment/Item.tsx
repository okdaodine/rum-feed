import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import replaceContent from 'utils/replaceContent';
import ago from 'utils/ago';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import Avatar from 'components/Avatar';
import ContentSyncStatus from 'components/ContentSyncStatus';
import { useStore } from 'store';
import TrxInfo from 'components/TrxInfo';
import UserCard from 'components/UserCard';
import { lang } from 'utils/lang';
import { IComment } from 'apis/types';
import { BsFillCaretDownFill } from 'react-icons/bs';
import openPhotoSwipe from 'components/openPhotoSwipe';
import Images from 'components/Images';
import { isMobile, isPc } from 'utils/env';
import Fade from '@material-ui/core/Fade';
import { IObject } from 'quorum-light-node-sdk';
import { TiArrowForwardOutline } from 'react-icons/ti';
import copy from 'copy-to-clipboard';
import Tooltip from '@material-ui/core/Tooltip';
import openLoginModal from 'components/openLoginModal';
import sleep from 'utils/sleep';
import { TrxApi } from 'apis';
import { FaRegComment } from 'react-icons/fa';

import './item.css';

interface IProps {
  comment: IComment
  postUserAddress: string
  submit: (payload: IObject) => void
  where: 'postList' | 'postDetail' | 'postDetailModal'
  selectComment?: any
  highlight?: boolean
  isTopComment?: boolean
  disabledReply?: boolean
}

export default observer((props: IProps) => {
  const { modalStore, userStore, commentStore, snackbarStore } = useStore();
  const commentRef = React.useRef<any>();
  const { comment, isTopComment } = props;
  const isSubComment = !isTopComment;
  const { threadId } = comment;
  const replyComment = comment.extra.replyComment;
  const domElementId = `${props.where}_comment_${comment.trxId}`;

  const state = useLocalObservable(() => ({
    canExpand: false,
    expand: false,
    anchorEl: null,
    showEditor: false,
    submitting: false,
    likeAnimating: false
  }));

  React.useEffect(() => {
    const setCanExpand = () => {
      if (
        commentRef.current
        && commentRef.current.scrollHeight > commentRef.current.clientHeight
      ) {
        state.canExpand = true;
      } else {
        state.canExpand = false;
      }
    };
    setCanExpand();
    window.addEventListener('resize', setCanExpand);
    return () => {
      window.removeEventListener('resize', setCanExpand);
    };
  }, [state, commentStore, comment.trxId]);

  const UserName = (props: {
    name: string
    isPostOwner: boolean
    isTopComment?: boolean
    isReplyTo?: boolean
  }) => (
    <span
      className={classNames(
        {
          'dark:text-white dark:text-opacity-80 text-gray-88 dark:md:text-white md:text-gray-500 md:opacity-80 font-bold': !props.isReplyTo,
          'text-sky-500': props.isReplyTo,
          'mr-[1px]': !props.isTopComment && isPc
        },
        'max-w-40 truncate text-14',
      )}
    >
      {props.isReplyTo && '@'}{props.name}
    </span>
  );

  const updateCounter = async (trxId: string) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    state.likeAnimating = !comment.extra.liked;
    try {  
      const res = await TrxApi.createObject({
        groupId: comment.groupId,
        object: {
          id: trxId,
          type: comment.extra.liked ? 'Dislike' : 'Like'
        },
      });
      console.log(res);
      commentStore.updateComment({
        ...comment,
        likeCount: comment.likeCount + (comment.extra.liked ? -1 : 1),
        extra: {
          ...comment.extra,
          liked: !comment.extra.liked
        }
      });
      await sleep(2000);
    } catch (err) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.submitting = false;
    state.likeAnimating = false;
  }

  return (
    <Fade in={true} timeout={350}>
      <div
        className={classNames(
          {
            highlight: props.highlight,
            'mt-[10px] p-2': isTopComment,
            'mt-1 px-2 py-[7px]': isSubComment,
            'border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-ec pb-4': isMobile && comment.commentCount === 0
          },
          'comment-item duration-500 ease-in-out -mx-2 rounded-6 group',
        )}
        id={`${domElementId}`}
      >
        <div className="relative">
          <UserCard
            userAddress={props.comment.userAddress}
          >
            <div
              className={classNames(
                {
                  'mt-[-2px]': isTopComment,
                  'mt-[-3px]': isSubComment,
                },
                'avatar absolute top-0 left-0',
              )}
            >
              <Avatar
                className="block"
                url={comment.extra.userProfile.avatar}
                size={isSubComment ? 28 : 34}
              />
            </div>
          </UserCard>
          <div
            className={classNames({
              'ml-[7px]': isSubComment,
              'ml-3': !isSubComment,
            })}
            style={{ paddingLeft: isSubComment ? 28 : 34 }}
          >
            <div>
              <div className="text-14 dark:text-white dark:text-opacity-80 text-gray-99 relative">
                {!isSubComment && (
                  <div className="md:mb-[3px] flex items-center">
                    <UserCard
                      userAddress={props.comment.userAddress}
                      className="inline-block"
                    >
                      <UserName
                        name={comment.extra.userProfile.name || ''}
                        isPostOwner={
                          comment.userAddress === props.postUserAddress
                        }
                        isTopComment
                      />
                    </UserCard>
                    <div
                      className="text-12 mr-3 tracking-wide text-gray-88 opacity-70 dark:text-white dark:opacity-40 flex items-center"
                    >
                      <span className="mx-[6px] transform scale-150 opacity-50">·</span>
                      {ago(comment.timestamp, { trimmed: true })}
                    </div>
                  </div>
                )}
                {isSubComment && (
                  <div>
                    <div
                      className={classNames(
                        {
                          'comment-expand': state.expand,
                        },
                        'comment-body comment dark:text-white dark:text-opacity-80 text-gray-1e break-words whitespace-pre-wrap ml-[1px] comment-fold',
                      )}
                      ref={commentRef}
                    >
                      <UserName
                        name={comment.extra.userProfile.name || ''}
                        isPostOwner={
                          comment.userAddress === props.postUserAddress
                        }
                      />
                      {threadId
                        && replyComment
                        && threadId !== replyComment.trxId ? (
                          <span>
                            <span className="opacity-80 mx-1">{lang.reply}</span>
                            <UserName
                              name={replyComment?.extra.userProfile.name || ''}
                              isPostOwner={
                                replyComment.userAddress
                              === props.postUserAddress
                              }
                              isReplyTo
                            />
                            ：
                          </span>
                        )
                        : '：'}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: replaceContent(`${comment.content}`),
                        }}
                      />
                      {comment.images && comment.images.length > 0 && (
                        <span
                          className="mx-[6px] text-sky-500 opacity-90 cursor-pointer"
                          onClick={() => {
                            openPhotoSwipe({
                              image: ((comment.images || [])[0]!),
                            });
                          }}
                        >
                          {lang.openImage}
                        </span>
                      )}
                    </div>

                    {!state.expand && state.canExpand && (
                      <div
                        className="text-sky-500 cursor-pointer pt-[6px] pb-[2px] ml-[1px] flex items-center text-12"
                        onClick={() => { state.expand = true; }}
                      >
                        {lang.expand}
                        <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              {!isSubComment && (
                <div className="mb-1">
                  <div
                    className={classNames(
                      {
                        'comment-expand': state.expand,
                        'pr-1': isSubComment,
                      },
                      'comment-body comment dark:text-white dark:text-opacity-80 text-gray-1e break-words whitespace-pre-wrap comment-fold',
                    )}
                    ref={commentRef}
                    dangerouslySetInnerHTML={{
                      __html: replaceContent(comment.content),
                    }}
                  />

                  {comment.images && comment.images.length > 0 && (
                    <div className="pt-2 pb-1">
                      <Images images={comment.images} />
                    </div>
                  )}

                  {!state.expand && state.canExpand && (
                    <div
                      className="text-sky-500 cursor-pointer pt-1 flex items-center text-12"
                      onClick={() => { state.expand = true; }}
                    >
                      {lang.expand}
                      <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
                    </div>
                  )}
                </div>
              )}
              <div className="items-center dark:text-white dark:text-opacity-80 text-gray-af leading-none mt-2 h-3 relative w-full flex">
                {isSubComment && (
                  <div
                    className="text-12 mr-5 tracking-wide text-gray-88 opacity-70 dark:text-white dark:opacity-40"
                  >
                    {ago(comment.timestamp, { trimmed: true })}
                  </div>
                )}
                <div
                  className={classNames(
                    {
                      'dark:text-white dark:text-opacity-80 text-black text-opacity-50 font-bold': comment.extra.liked
                    },
                    'flex items-center cursor-pointer pr-6 tracking-wide leading-none',
                  )}
                  onClick={() => updateCounter(comment.trxId)}
                >
                  <span className="flex items-center text-14 pr-[3px]">
                    {comment.extra.liked ? (
                      <RiThumbUpFill className={classNames({ "animate-scale": state.likeAnimating })} />
                    ) : (
                      <RiThumbUpLine />
                    )}
                  </span>
                  <span className="text-12 mr-[1px] dark:opacity-90">
                    {comment.likeCount || ''}
                  </span>
                </div>
                {!props.disabledReply && !(isSubComment && comment.userAddress === userStore.address) && (
                  <span
                    className='flex items-center cursor-pointer pr-6 tracking-wide'
                    onClick={() => {
                      modalStore.commentReply.show({
                        postUserAddress: props.postUserAddress,
                        comment,
                        submit: props.submit,
                        where: props.where
                      });
                    }}
                  >
                    <span className="flex items-center text-14">
                      <FaRegComment />
                    </span>
                  </span>
                )}
                <div
                  className='items-center cursor-pointer pr-6 tracking-wide leading-none hidden group-hover:flex'
                  onClick={() => {
                    copy(`${window.origin}/posts/${comment.objectId}?commentId=${comment.trxId}`);
                    snackbarStore.show({
                      message: `链接${lang.copied}`,
                    });
                  }}
                >
                  <Tooltip
                    enterDelay={200}
                    enterNextDelay={200}
                    placement="top"
                    title='复制链接'
                    arrow
                    >
                    <div className="flex items-center text-18">
                      <TiArrowForwardOutline />
                    </div>
                  </Tooltip>
                </div>
                <div className='ml-[2px] mt-[2px]'>
                  <ContentSyncStatus
                    trxId={comment.trxId}
                    storage={comment.storage}
                    SyncedComponent={() => (
                      <TrxInfo
                        groupId={comment.groupId}
                        trxId={comment.trxId}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  );
});

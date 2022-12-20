import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { isSafari, isIPhone } from 'utils/env';
import replaceContent from 'utils/replaceContent';
import { FaRegComment } from 'react-icons/fa';
import { useStore } from 'store';
import { IComment, IPost } from 'apis/types';
import ago from 'utils/ago';
import Fade from '@material-ui/core/Fade';
import { TiArrowForwardOutline } from 'react-icons/ti';
import copy from 'copy-to-clipboard';
import { lang } from 'utils/lang';
import openLoginModal from 'components/openLoginModal';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import Images from 'components/Images';
import openPhotoSwipe from 'components/openPhotoSwipe';
import sleep from 'utils/sleep';
import { TrxApi } from 'apis';
import { BsFillCaretDownFill } from 'react-icons/bs';

import './Item.css';

interface IProps {
  comment: IComment
  post: IPost
  replyTo: (comment: IComment) => void
  highlight?: boolean
  selectComment?: any
  isTopComment?: boolean
  noSubComments?: boolean
  isPreview?: boolean

  hideDivider?: boolean
}

export default observer((props: IProps) => {
  const state = useLocalStore(() => ({
    submitting: false,
    likeAnimating: false,
    canExpand: false,
    expand: false,
    readyToFold: isSafari || isIPhone ? false : true,
  }));
  const { commentStore, userStore, snackbarStore } = useStore();
  const commentRef = React.useRef<any>();
  const {
    hideDivider,
    replyTo,
    comment,
    selectComment,
    highlight,
    noSubComments,
    isTopComment,
    isPreview,
  } = props;

  React.useEffect(() => {
    if (
      commentStore.mobile.topCommentPage.open &&
      commentStore.mobile.topCommentPage.topComment?.trxId === comment.trxId
    ) {
      return;
    }
    const setCanExpand = () => {
      if (commentRef.current && (commentRef.current.scrollHeight > commentRef.current.clientHeight || commentRef.current.clientHeight > 240)) {
        state.canExpand = true;
      } else {
        state.canExpand = false;
      }
    };

    setCanExpand();
    window.addEventListener('resize', setCanExpand);
    if (isSafari || isIPhone) {
      setTimeout(() => {
        state.readyToFold = true;
        setTimeout(() => {
          setCanExpand();
        }, 0);
      }, 100);
    }
    return () => {
      window.removeEventListener('resize', setCanExpand);
    };
  }, [state, commentStore, comment.trxId]);

  const isOwner = comment.userAddress === userStore.address;
  const isFromAuthor = props.post.userAddress === comment.userAddress;
  const isAuthor = props.post.userAddress === userStore.address;

  const contentPrefix =
    comment.threadId && comment.extra.replyComment && comment.threadId !== comment.extra.replyComment.trxId
      ? `回复 <span class="text-sky-500">${comment.extra.replyComment.extra.userProfile.name}</span>：`
      : '';
  const previewContentPrefix =
    comment.threadId && comment.extra.replyComment && comment.threadId !== comment.extra.replyComment.trxId
      ? `<span class="text-sky-500">${comment.extra.userProfile.name}</span> 回复 <span class="text-sky-500">${comment.extra.replyComment.extra.userProfile.name}</span>：`
      : `<span class="text-sky-500">${comment.extra.userProfile.name}</span>：`;

  if (isPreview) {
    return (
      <div className="pt-[2px]" id={`comment_${commentStore.mobile.topCommentPage.open ? '_xxx_' : ''}${comment.trxId}`}>
        <span
          className="dark:text-white dark:text-opacity-80 text-gray-1e break-words"
          dangerouslySetInnerHTML={{ __html: replaceContent(`${previewContentPrefix}${comment.content}`, { disabled: true }) }}
        />
        {comment.images && comment.images.length > 0 && (
          <span
            className="mx-[6px] text-sky-500 opacity-90 cursor-pointer"
            onClick={(e) => {
              openPhotoSwipe({
                image: ((comment.images || [])[0]!),
              });
              e.stopPropagation();
            }}
          >
            {lang.openImage}
          </span>
        )}
      </div>
    );
  }

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
          type: comment.extra.liked ? 'Dislike' : 'Like',
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
            highlight: highlight,
            'border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-200': !hideDivider && noSubComments,
            'md:pb-1': !isTopComment,
          },
          'mobile-comment-item pt-4 pr-4 duration-500 ease-in-out pl-4 md:pt-4',
        )}
        id={`comment_${comment.trxId}`}
      >
        <div className="relative">
          <div className="avatar absolute top-0 left-0">
            <Link to={`/users/${comment.userAddress}`}>
              <img
                onClick={async () => {
                  await sleep(400);
                  commentStore.mobile.topCommentPage.setOpen(false);
                }}
                src={comment.extra.userProfile.avatar}
                width={34}
                height={34}
                alt="avatar"
                className="rounded-full"
              />
            </Link>
          </div>
          <div className="ml-10-px md:ml-3" style={{ paddingLeft: 36 }}>
            <div className="flex justify-between items-start md:items-center">
              <div className="flex items-center leading-[1.2] text-14 dark:text-white dark:text-opacity-80 text-gray-99 relative">
                <Link to={`/${comment.groupId}/users/${comment.userAddress}`} >
                  <span
                    onClick={async () => {
                      await sleep(400);
                      commentStore.mobile.topCommentPage.setOpen(false);
                    }}
                    className='truncate text-14 dark:text-white dark:text-opacity-50 text-gray-88 max-w-[150px] block'
                  >
                    {comment.extra.userProfile.name}
                  </span>
                </Link>
                <div className="text-12 mr-3 tracking-wide text-gray-88 opacity-70 dark:text-white dark:opacity-40 flex items-center">
                  <span className="mx-[6px] transform scale-150 opacity-50">·</span>
                  {ago(comment.timestamp, { trimmed: true })}
                </div>
              </div>
            </div>
            <div
              className={classNames(
                {
                  'pb-3': noSubComments,
                },
                'mt-4-px md:mt-2',
              )}
            >
              <div className="mb-4-px md:mb-1">
                {!comment.threadId && comment.extra.replyComment && (
                  <div
                    className="border-blue-300 pl-2 text-12 cursor-pointer md:mt-0"
                    style={{ borderLeftWidth: '3px' }}
                    onClick={() => {
                      if (commentStore.mobile.topCommentPage.open) {
                        return;
                      }
                      selectComment(comment.extra.replyComment?.trxId, {
                        useScrollIntoView: true,
                        behavior: 'smooth',
                      });
                    }}
                  >
                    <div className="text-sky-500">{comment.extra.replyComment.extra.userProfile.name}</div>
                    <div className="truncate dark:text-white dark:text-opacity-80 text-gray-99">{comment.extra.replyComment.content}</div>
                  </div>
                )}
              </div>
              <div
                className={classNames(
                  {
                    'comment-expand': state.expand,
                    'comment-fold': !state.expand && state.readyToFold
                  },
                  'comment-body comment mt-2 dark:text-white dark:text-opacity-80 text-gray-1e break-words whitespace-pre-wrap',
                )}
                onClick={(e: any) => {
                  if (isOwner) {
                    return;
                  }
                  if (isAuthor && isFromAuthor) {
                    return;
                  }
                  if (e.target && e.target.tagName === 'A') {
                    return;
                  }
                  replyTo(comment);
                }}
                ref={commentRef}
                dangerouslySetInnerHTML={{
                  __html: replaceContent(`${contentPrefix}${comment.content}`),
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
                  onClick={() => (state.expand = true)}
                >
                  {lang.expand}
                  <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
                </div>
              )}

              <div className="flex items-center dark:text-white dark:text-opacity-40 text-gray-9b leading-none mt-3">
                <div
                  className={classNames({
                    'dark:text-white dark:text-opacity-80 text-black text-opacity-60 font-bold': comment.extra.liked
                  }, 'flex items-center cursor-pointer pr-6')}
                  onClick={() => updateCounter(comment.trxId)}
                >
                  <span className="flex items-center text-16 pr-1 md">
                    {comment.extra.liked ? (
                      <RiThumbUpFill className={classNames({ "animate-scale": state.likeAnimating })} />
                    ) : (
                      <RiThumbUpLine />
                    )}
                  </span>
                  <span className={classNames({
                    'dark:opacity-90': comment.extra.liked
                  }, "text-12")}>{Number(comment.likeCount) || ''}</span>
                </div>
                {(isTopComment || comment.userAddress !== userStore.address) && (  
                  <div
                    className="flex items-center justify-center cursor-pointer pr-6"
                    onClick={() => replyTo(comment)}
                  >
                    <span className="flex items-center text-16">
                      <FaRegComment />
                    </span>
                  </div>
                )}
                <div
                  className='flex items-center justify-center cursor-pointer pr-6'
                  onClick={() => {
                    copy(`${window.origin}/posts/${comment.objectId}?commentId=${comment.trxId}`);
                    snackbarStore.show({
                      message: `链接${lang.copied}`,
                    });
                  }}
                >
                  <span className="flex items-center text-20 pr-1 opacity-80">
                    <TiArrowForwardOutline />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  );
});

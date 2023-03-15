import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import BottomLine from 'components/BottomLine';
import { debounce } from 'lodash';
import { toJS } from 'mobx';
import Comments from './items';
import { useStore } from 'store';
import { TrxStorage } from 'apis/common';
import { IComment, IPost } from 'apis/types';
import openLoginModal from 'components/Wallet/openLoginModal';
import { CommentApi, TrxApi } from 'apis';
import { FaComment } from 'react-icons/fa';
import { lang } from 'utils/lang';
import Query from 'utils/query';
import sleep from 'utils/sleep';
import Loading from 'components/Loading';
import TopItemPageModal from './TopItemPageModal';
import FixedCommentEntry from './FixedCommentEntry';
import EditorModal from './EditorModal';
import { IActivity } from 'rum-sdk-browser';
import { v4 as uuid } from 'uuid';
import base64 from 'utils/base64';

import './index.css';

interface IProps {
  post: IPost;
  updateCounter: (id: string) => any
}

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    isFetching: true,
    replyingComment: null as IComment | null,
    isCreatingComment: false,
    isCreating: false,
    openEditorModal: false,
    openCommentEntry: true,
  }));
  const {
    commentStore,
    postStore,
    snackbarStore,
    userStore,
    modalStore,
    groupStore,
    confirmDialogStore
  } = useStore();
  const hasComments = props.post.commentCount > 0;
  const topComments = commentStore.comments.filter(
    (comment) => !comment.threadId,
  );

  React.useEffect(() => {
    (async () => {
      try {
        const comments = await CommentApi.list({
          objectId: props.post.id,
          viewer: userStore.address,
          offset: 0,
          limit: 1000
        });
        commentStore.reset();
        commentStore.addComments(comments);
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
    })();
  }, []);

  React.useEffect(() => {
    if (state.isFetching) {
      return;
    }
    const selectedId = Query.get('commentId');
    if (!selectedId) {
      return;
    }
    (async () => {
      const selectedComment = commentStore.map[selectedId];
      if (!selectedComment) {
        modalStore.pageLoading.hide();
        await sleep(200);
        confirmDialogStore.show({
          content: lang.notFound(lang.comment),
          cancelDisabled: true,
          okText: lang.gotIt,
          ok: () => {
            confirmDialogStore.hide();
          },
        });
        return;
      }
      if (selectedComment.threadId) {
        modalStore.pageLoading.hide();
        await sleep(200);
        const comment = commentStore.map[selectedComment.threadId];
        commentStore.mobile.topCommentPage.setTopComment(comment);
        commentStore.mobile.topCommentPage.setOpen(true);
        await sleep(500);
        selectComment(selectedId, {
          useScrollIntoView: true,
        });
        await sleep(200);
        selectComment(selectedComment.threadId, {
          useScrollIntoView: true,
          silent: true,
        });
        await sleep(100);
      } else {
        await sleep(400);
        selectComment(selectedId, {
          useScrollIntoView: true,
        });
      }
      Query.remove('commentId');
    })();
  }, [state.isFetching]);

  React.useEffect(() => {
    const scrollCallBack = debounce(() => {
      const commentDom: any = document.querySelector('.comment');
      if (!commentDom) {
        return;
      }
      const commentOffsetTop = commentDom.offsetTop;
      state.openCommentEntry = window.scrollY + window.innerHeight > commentOffsetTop + 50;
    }, 300);
    window.addEventListener('scroll', scrollCallBack);
    return () => {
      window.removeEventListener('scroll', scrollCallBack);
    };
  }, []);

  const _submit = async (activity: IActivity) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    const res = await TrxApi.createActivity(activity, props.post.groupId);
    console.log(res);
    const comment: IComment = {
      content: activity.object?.content || '',
      images: (activity.object?.image as [])?.map(image => base64.getUrl(image as any)) ?? [],
      objectId: props.post.id,
      threadId: '',
      replyId: '',
      userAddress: userStore.address,
      groupId: props.post.groupId,
      trxId: res.trx_id,
      id: activity.object?.id ?? '',
      storage: TrxStorage.cache,
      commentCount: 0,
      likeCount: 0,
      timestamp: Date.now(),
      extra: {
        userProfile: toJS(userStore.profile)
      }
    };
    const { inreplyto } = activity.object!;
    if (inreplyto) {
      const toCommentId = inreplyto.id;
      if (toCommentId) {
        const toComment = commentStore.map[toCommentId];
        if (toComment) {
          if (toComment.threadId) {
            comment.threadId = toComment.threadId;
            comment.replyId = toComment.id;
          } else {
            comment.threadId = toComment.id;
          }
        }
      }
    }
    return comment;
  }

  const submit = async (value: string) => {
    if (state.isCreatingComment || state.isCreating) {
      return;
    }
    value = value.trim();
    if (!value) {
      return;
    }
    forceBlur();
    state.isCreating = true;
    try {
      const activity: IActivity = {
        type: 'Create',
        object: {
          type: 'Note',
          id: uuid(),
          content: value,
          inreplyto: {
            type: 'Note',
            id: state.replyingComment
              ? state.replyingComment.id
              : props.post.id,
          },
        },
      };
      const newComment = (await _submit(activity))!;
      commentStore.addComment(newComment);
      postStore.updatePost({
        ...props.post,
        commentCount: props.post.commentCount + 1
      });
      if (state.openEditorModal) {
        state.openEditorModal = false;
        state.replyingComment = null;
      }
      const silent = !(
        state.replyingComment &&
        !state.replyingComment.threadId &&
        !commentStore.mobile.topCommentPage.open
      );
      if (silent) {
        await sleep(100);
        selectComment(newComment.id, {
          useScrollIntoView: true,
          isNewComment: true,
        });
      }
      snackbarStore.show({
        message: lang.published,
        duration: 1000,
      });
      return true;
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
      return false;
    } finally {
      state.isCreating = false;
    }
  };

  const selectComment = async (id: string, options: any) => {
    await sleep(options.sleep || 10);
    const domElementId = `comment_${id}`;
    const comment = commentStore.map[id];
    if (!comment) {
      console.error('selected comment not found');
      return;
    }
    const element = document.querySelector(`#${domElementId}`);
    if (!element) {
      return;
    }
    if (options.silent) {
      element.scrollIntoView({
        block: options.scrollBlock || 'center',
      });
      return;
    }
    commentStore.setSelectedComment(comment);
    element.scrollIntoView({
      block: options.scrollBlock || 'center',
    });
    modalStore.pageLoading.hide();
    await sleep(options.isNewComment ? 1000 : 1500);
    commentStore.setSelectedComment(null);
  };

  const forceBlur = () => {
    setTimeout(() => {
      const canTriggerBlurDom: any = document.querySelector('body');
      canTriggerBlurDom.click();
    }, 100);
  };

  const replyTo = (comment: IComment) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    state.replyingComment = comment;
    state.openEditorModal = true;
  };

  const replyToPost = () => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    state.openEditorModal = true;
  }

  if (state.isFetching) {
    return (
      <div className="flex justify-center pt-32 min-h-[70vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="pb-12 -ml-4 -mr-2 comment min-h-[90vh]" id="comment-section">
      <div className="mt-4 pb-4 border-t-[10px] dark:border-white dark:border-opacity-[0.04] border-gray-f7" />
      {!hasComments && (
        <div className="py-24 text-center dark:text-white dark:text-opacity-80 text-gray-500 text-14 tracking-wider opacity-80">
          {lang.letUsLeaveAComment}
        </div>
      )}
      {hasComments && (
        <div className="text-16 px-5 font-bold flex dark:text-white dark:text-opacity-80 text-gray-64 pb-3 opacity-80">
          <div className="flex items-center">
            <span className="mr-2">
              <FaComment className="text-20" />
            </span>{' '}
            {lang.totalComment(props.post.commentCount)}
          </div>
        </div>
      )}
      {hasComments && (
        <div id="comments" className="overflow-hidden">
          <Comments
            replyTo={replyTo}
            selectComment={selectComment}
            post={props.post}
          />
          <TopItemPageModal
            replyTo={replyTo}
            selectComment={selectComment}
            post={props.post}
          />
        </div>
      )}
      <EditorModal
        open={state.openEditorModal}
        replyingComment={state.replyingComment}
        isCreating={state.isCreating}
        submit={submit}
        onClose={() => {
          state.openEditorModal = false;
          state.replyingComment = null;
        }}
      />
      <FixedCommentEntry
        replyTo={replyTo}
        replyToPost={replyToPost}
        likePost={props.updateCounter}
        post={props.post}
      />
      <div className="pt-3 pb-5">
        <div className="ios-safe-area-padding" />
        {topComments.length > 5 && (
          <BottomLine />
        )}
      </div>
    </div>
  );
});

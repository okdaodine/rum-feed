import { observer, useLocalObservable } from 'mobx-react-lite';
import { FaRegComment, FaComment } from 'react-icons/fa';
import { IPost } from 'apis/types';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import Comment from 'components/Comment';
import CommentMobile from 'components/Comment/Mobile';
import { TrxStorage, OBJECT_STATUS_DELETED_LABEL } from 'apis/common';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import classNames from 'classnames';
import ContentSyncStatus from 'components/ContentSyncStatus';
import Menu from 'components/ObjectMenu';
import { useHistory } from 'react-router-dom';
import sleep from 'utils/sleep';
import openEditor from 'components/Post/OpenEditor';
import openLoginModal from 'components/openLoginModal';
import { isMobile, isPc } from 'utils/env';
import { TiArrowForwardOutline } from 'react-icons/ti';
import { lang } from 'utils/lang';
import copy from 'copy-to-clipboard';
import Tooltip from '@material-ui/core/Tooltip';
import { TrxApi, PostApi } from 'apis';

interface IProps {
  post: IPost
  where: 'postList' | 'postDetail' | 'postDetailModal'
  hideBottom?: boolean
}

export default observer((props: IProps) => {
  const {
    confirmDialogStore,
    snackbarStore,
    postStore,
    modalStore,
    userStore,
  } = useStore();
  const { post } = props;
  const inPostDetail = props.where.startsWith('postDetail');
  const state = useLocalObservable(() => ({
    showComment: inPostDetail || false,
    submitting: false,
    likeAnimating: false,
  }));
  const liked = post.extra?.liked;
  const likeCount = post.likeCount;
  const history = useHistory()

  const updateCounter = async (trxId: string) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    state.likeAnimating = !post.extra.liked;
    try {
      const res = await TrxApi.createObject({
        groupId: post.groupId,
        object: {
          id: trxId,
          type: post.extra.liked ? 'Dislike' : 'Like'
        },
      });
      console.log(res);
      postStore.updatePost({
        ...post,
        likeCount: post.likeCount + (post.extra.liked ? -1 : 1),
        extra: {
          ...post.extra,
          liked: !post.extra.liked
        }
      });
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    await sleep(2000);
    state.submitting = false;
    state.likeAnimating = false;
  }

  const deletePost = async (trxId: string) => {
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    try {
      const res = await TrxApi.createObject({
        groupId: post.groupId,
        object: {
          type: 'Note',
          content: OBJECT_STATUS_DELETED_LABEL,
          id: trxId
        },
      });
      console.log(res);
    } catch (err) {
      console.log(err);
    }
    state.submitting = false;
  }

  const deletePostByAdmin = async (trxId: string) => {
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    try {
      await PostApi.remove(trxId);
    } catch (err) {
      console.log(err);
    }
    state.submitting = false;
  }

  return (
    <div>
      {!props.hideBottom && (
        <div className="pl-12 ml-1 flex items-center dark:text-white dark:text-opacity-50 text-gray-88 leading-none text-12">
          <div
            className={classNames(
              {
                'dark:text-white dark:text-opacity-80 text-black text-opacity-60 font-bold': liked,
              },
              'flex items-center pl-0 p-2 pr-5 cursor-pointer tracking-wide',
            )}
            onClick={() => {
              updateCounter(post.trxId);
            }}
          >
            <div className="text-16 mr-[6px]">
              {liked ? (
                <RiThumbUpFill className={classNames({ "animate-scale": state.likeAnimating })} />
              ) : (
                <RiThumbUpLine />
              )}
            </div>
            {likeCount ? (
              <span className={classNames({
                'dark:opacity-90': liked
              }, "mr-[10px] md:mr-1")}>{likeCount || ''}</span>
            )
              : <span className={classNames({
                'invisible': isMobile
              })}>赞</span>}
          </div>
          <div
            className={classNames(
              {
                'dark:text-white dark:text-opacity-80 text-black text-opacity-60': state.showComment,
              },
              'flex items-center p-2 pl-0 md:pl-2 mr-3 cursor-pointer tracking-wide mt-[-1px]',
            )}
            onClick={() => {
              if (inPostDetail) {
                return;
              }
              if (isMobile) {
                history.push(`/posts/${post.trxId}`);
                return;
              }
              state.showComment = !state.showComment;
            }}
            data-test-id="timeline-post-comment-button"
          >
            <div className="text-16 mr-[6px]">
              {state.showComment ? (
                <FaComment />
              ) : (
                <FaRegComment />
              )}
            </div>
            {post.commentCount ? (
              <span className="mr-1 mt-[1px]">{post.commentCount}</span>
            )
              : <span className="hidden md:block">评论</span>}
          </div>
          <div
            className='flex items-center p-2 py-1 mr-5 cursor-pointer tracking-wide dark:text-white dark:text-opacity-50 opacity-80'
            onClick={() => {
              copy(`${window.origin}/posts/${post.trxId}`);
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
              <div className="text-20 mr-[6px]">
                <TiArrowForwardOutline />
              </div>
            </Tooltip>
          </div>
          <div className="mt-[1px]">
            <ContentSyncStatus
              trxId={post.trxId}
              storage={post.storage}
              SyncedComponent={() => (
                <div className="mt-[-1px]">
                  <Menu
                    data={{
                      groupId: post.groupId,
                      trxId: post.trxId,
                      userAddress: post.userAddress
                    }}
                    onClickUpdateMenu={async () => {
                      const newPost = await openEditor(post);
                      if (newPost) {
                        postStore.updatePost({
                          ...post,
                          latestTrxId: '',
                          commentCount: post.commentCount,
                          hotCount: post.hotCount,
                          likeCount: post.likeCount,
                          timestamp: post.timestamp,
                          storage: TrxStorage.cache,
                        });
                      }
                    }}
                    onClickDeleteMenu={() => {
                      const deleteByAdmin = userStore.user.role === 'admin' && post.userAddress !== userStore.address;
                      confirmDialogStore.show({
                        content: deleteByAdmin ? '这是一条来自他人的内容，由于您是管理员，所以您有权利<strong>从界面上</strong>移除这条内容，确定移除吗？' : '确定删除吗？',
                        cancelText: '取消',
                        ok: async () => {
                          confirmDialogStore.setLoading(true);
                          await (deleteByAdmin ? deletePostByAdmin(post.trxId): deletePost(post.trxId));
                          confirmDialogStore.hide();
                          await sleep(400);
                          if (props.where === 'postDetailModal') {
                            modalStore.postDetail.hide();
                            await sleep(400);
                          }
                          if (inPostDetail) {
                            history.push(`/`);
                          }
                          postStore.removePost(post.trxId);
                          snackbarStore.show({
                            message: deleteByAdmin ? '已从界面上移除' : '已删除'
                          });
                        },
                      });
                    }}
                  />
                </div>
              )}
              alwaysShow
            />
          </div>
        </div>
      )}
      {state.showComment && (
        <Fade in={true} timeout={500}>
          <div>
            {isPc && (
              <div className="mt-4 pb-2">
                <Comment
                  post={post}
                  where={props.where}
                />
              </div>
            )}
            {isMobile && (
              <CommentMobile
                post={post}
                updateCounter={updateCounter}
              />
            )}
          </div>
        </Fade>
      )}
    </div>
  );
});

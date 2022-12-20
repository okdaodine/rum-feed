import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import { IPost, IComment } from 'apis/types';
import Fade from '@material-ui/core/Fade';
import classNames from 'classnames';
import { FaRegComment } from 'react-icons/fa';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';

interface IProps {
  replyTo: (comment: IComment) => void
  replyToPost: () => void
  likePost: (postTrxId: string) => void
  post: IPost
}

export default observer((props: IProps) => {
  const { commentStore, userStore } = useStore();
  const state = useLocalObservable(() => ({
    submitting: false,
    likeAnimating: false
  }));
  const {
    mobile: {
      openEditorEntryDrawer,
      topCommentPage,
    }
  } = commentStore;

  if (openEditorEntryDrawer) {
    return null;
  }

  if (topCommentPage.open && topCommentPage.topComment?.userAddress === userStore.address) {
    return null;
  }

  return (
    <Fade in={true} timeout={200}>
      <div className="fixed entry bottom-0 left-0 w-full border-t dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-200 bg-white dark:bg-[#181818]">
        <div className="py-2 flex items-center justify-between">
          <div
            className={classNames(
              {
                'mx-4': topCommentPage.open,
              },
              'flex-1 mx-3 rounded-lg dark:bg-[#181818] bg-gray-f2 dark:text-white dark:text-opacity-60 text-gray-88 py-2 px-3',
            )}
            onClick={() => {
              if (topCommentPage.topComment) {
                props.replyTo(topCommentPage.topComment);
              } else {
                props.replyToPost();
              }
            }}
          >
            {topCommentPage.open
              ? `回复 ${topCommentPage.topComment?.extra.userProfile.name}`
              : '写评论...'}
          </div>
          {!topCommentPage.open && (
            <div className="flex items-center py-1 dark:text-white dark:text-opacity-60 text-gray-99">
              <div
                className="pl-4 pr-2 relative font-bold flex items-center"
                onClick={() => {
                  if (props.post.commentCount === 0) {
                    if (topCommentPage.topComment) {
                      props.replyTo(topCommentPage.topComment);
                    } else {
                      props.replyToPost();
                    }
                    return;
                  }
                  const commentSection = document.getElementById('comment-section');
                  if (commentSection) {
                    commentSection.scrollIntoView();
                  }
                }}
              >
                <FaRegComment className="text-18" />
                {props.post.commentCount > 0 && (
                  <span className="text-14 ml-1 mt-[2px]">{props.post.commentCount}</span>
                )}
              </div>
              <div
                onClick={async () => {
                  state.likeAnimating = !props.post.extra.liked;
                  await props.likePost(props.post.trxId);
                  state.likeAnimating = false;
                }}
                className={classNames({
                  'dark:text-white dark:text-opacity-80 text-black text-opacity-60': props.post.extra.liked
                }, 'pl-4 pr-6 relative font-bold flex items-center text-18')}
              >
                {props.post.extra.liked ? (
                  <RiThumbUpFill className={classNames({ "animate-scale": state.likeAnimating })} />
                ) : (
                  <RiThumbUpLine />
                )}
                {props.post.likeCount > 0 && (
                  <span className="text-14 ml-1 mt-[2px] dark:opacity-90">{props.post.likeCount}</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="ios-safe-area-padding" />
      </div>
    </Fade>
  )
})
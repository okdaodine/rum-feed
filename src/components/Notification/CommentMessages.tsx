import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import { GoChevronRight } from 'react-icons/go';
import Images from 'components/Images';
import ago from 'utils/ago';
import { INotification, IComment } from 'apis/types';
import Query from 'utils/query';
import { useHistory } from 'react-router-dom';
import { isMobile } from 'utils/env';
import sleep from 'utils/sleep';
import replaceContent from 'utils/replaceContent';

interface IMessagesProps {
  notifications: INotification[]
  unreadCount: number
  close: () => void,
  toUserPage: (userAddress: string) => void,
}

export default observer((props: IMessagesProps) => {
  const { modalStore, snackbarStore } = useStore();
  const { notifications } = props;
  const history = useHistory();

  const toPost = (url: string) => {
    const inPostDetail = window.location.pathname.includes('/posts/');
    if (inPostDetail) {
      window.location.href = url;
    } else {
      history.push(url);
    }
  }

  return (
    <div>
      {notifications.map((notification, index) => {
        const { fromProfile, fromObject, toObject } = notification.extra;

        const showLastReadFlag = (index === props.unreadCount - 1) && index < notifications.length - 1;
        return (
          <div key={notification.id}>
            <div
              className={classNames(
                {
                  'pb-2': showLastReadFlag,
                  'pb-[18px]': !showLastReadFlag,
                  'border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-ec': index !== notifications.length - 1
                },
                'p-2 pt-6',
              )}
            >
              <div className="relative">
                <Avatar
                  onClick={() => props.toUserPage(fromProfile.userAddress)}
                  className="absolute top-[-5px] left-0 cursor-pointer"
                  url={fromProfile.avatar}
                  size={40}
                />
                <div className="pl-10 ml-3 text-13">
                  <div className="flex items-center leading-none">
                    <div className="dark:text-white dark:text-opacity-80 text-gray-4a font-bold cursor-pointer" onClick={() => props.toUserPage(fromProfile.userAddress)}>
                      {fromProfile.name}
                    </div>
                    <div className="ml-2 dark:text-white dark:text-opacity-50 text-gray-9b text-12">
                      {notification.toObjectType === 'post' && lang.replyYourContent}
                      {notification.toObjectType === 'comment' && lang.replyYourComment}
                    </div>
                  </div>
                  <div
                    className="mt-[9px] opacity-90 break-words"
                  >
                    {fromObject &&  (
                      <div>
                        <div dangerouslySetInnerHTML={{
                          __html: replaceContent(fromObject.content || '')
                        }}/>
                        {!fromObject.content && fromObject.images && <Images images={fromObject.images || []} />}
                      </div>
                    )}
                    {!fromObject && (
                      <div className="opacity-60">
                        内容已被删除
                      </div>
                    )}
                  </div>
                  <div className="pt-3 mt-[2px] text-12 flex items-center dark:text-white dark:text-opacity-50 text-gray-9b leading-none">
                    <div className="mr-6 opacity-80">
                      {ago(notification.timestamp, { trimmed: true })}
                    </div>
                    <div
                      className="mr-3 cursor-pointer dark:text-white dark:text-opacity-50 hover:font-bold flex items-center opacity-90"
                      onClick={async () => {
                        if (!toObject) {
                          snackbarStore.show({
                            message: '内容已被删除',
                            type: 'error',
                          });
                          return;
                        }
                        if (isMobile) {
                          const objectId = (notification.extra.fromObject as IComment).objectId;
                          const commentId = (notification.extra.fromObject as IComment).trxId;
                          props.close();
                          await sleep(400);
                          toPost(`/posts/${objectId}?commentId=${commentId}`);
                        } else {
                          Query.set({
                            commentId: (notification.extra.fromObject as IComment).trxId
                          });
                          modalStore.postDetail.show({
                            trxId: (notification.extra.fromObject as IComment).objectId,
                          });
                        }
                      }}
                    >
                      {lang.open}
                      <GoChevronRight className="text-12 opacity-70 ml-[-1px]" />
                    </div>
                  </div>
                </div>
              </div>
              {showLastReadFlag && (
                <div className="w-full text-12 text-center pt-10 dark:text-white dark:text-opacity-80 text-gray-400 ">
                  {lang.lastReadHere}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

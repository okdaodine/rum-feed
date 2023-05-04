import React from 'react';
import { observer } from 'mobx-react-lite';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import { GoChevronRight } from 'react-icons/go';
import Images from 'components/Images';
import ago from 'utils/ago';
import { INotification, IPost } from 'apis/types';
import { useStore } from 'store';
import { useHistory } from 'react-router-dom';
import { isMobile } from 'utils/env';
import sleep from 'utils/sleep';
import replaceContent from 'utils/replaceContent';
import extractUrls from 'utils/extractUrls';

import './index.css';

interface IMessagesProps {
  notifications: INotification[]
  unreadCount: number
  close: () => void,
  toUserPage: (userAddress: string) => void,
}

export default observer((props: IMessagesProps) => {
  const { modalStore } = useStore();
  const history = useHistory();
  const notifications = React.useMemo(() => {
    return props.notifications.map(notification => {
      const { fromObject: post } = notification.extra;
      if (post) {
        const postContent = post.content.trim();
        const lastUrl = extractUrls(post.content || '').pop();
        if (lastUrl && postContent.endsWith(lastUrl)) {
          post.content = postContent.slice(0, -lastUrl.length);
        }
      }
      return notification;
    });
  }, [props.notifications]);

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
                'p-2 pt-6 border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-ec',
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
                      {lang.retweetYour(notification.toObjectType === 'post' ? lang.object : lang.comment)}
                    </div>
                  </div>
                  {fromObject && (fromObject.content || fromObject.images) &&  (
                    <div className="mt-[9px] opacity-90 break-words">
                      <div dangerouslySetInnerHTML={{
                        __html: replaceContent(fromObject.content || '')
                      }}/>
                      {!fromObject.content && fromObject.images && <Images images={fromObject.images || []} />}
                    </div>
                  )}
                  <div
                    className="mt-3 border-l-[3px] dark:border-white dark:border-opacity-30 border-gray-af pl-[9px] text-13 dark:text-white dark:text-opacity-70 text-gray-4a opacity-70"
                  >
                    {toObject && (
                      <div
                        className="inline-block like-messages-content"
                        dangerouslySetInnerHTML={{
                          __html: replaceContent(toObject.content || '')
                        }}
                      >
                      </div>
                    )}
                    {toObject && !toObject.content && toObject.images && (<Images images={toObject.images || []} />)}
                    {!toObject && (
                      <div className="inline-block like-messages-content opacity-60">
                        {lang.notFound(lang.content)}
                      </div>
                    )}
                  </div>
                  <div className="pt-3 mt-[5px] text-12 flex items-center dark:text-white dark:text-opacity-50 text-gray-9b leading-none">
                    <div className="mr-6 opacity-80">
                      {ago(notification.timestamp, { trimmed: true })}
                    </div>
                    {fromObject && (
                      <div
                        className="mr-3 cursor-pointer dark:text-white dark:text-opacity-50 hover:font-bold flex items-center opacity-90"
                        onClick={async () => {
                          if (notification.toObjectType === 'post') {
                            if (isMobile) {
                              props.close();
                              await sleep(400);
                              toPost(`/posts/${(fromObject as IPost).id}`);
                            } else {
                              modalStore.postDetail.show({
                                id: (fromObject as IPost).id,
                              });
                            }
                          }
                        }}
                      >
                        {lang.open}
                        <GoChevronRight className="text-12 opacity-70 ml-[-1px]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {showLastReadFlag && (
                <div className="w-full text-12 text-center pt-10 dark:text-white dark:text-opacity-80 text-gray-400">
                  {lang.lastSeenHere}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

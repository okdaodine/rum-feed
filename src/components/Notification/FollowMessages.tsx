import { observer } from 'mobx-react-lite';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import ago from 'utils/ago';
import { INotification } from 'apis/types';

import './index.css';

interface IMessagesProps {
  notifications: INotification[]
  unreadCount: number
  close: () => void,
  toUserPage: (userAddress: string) => void,
}

export default observer((props: IMessagesProps) => {
  const { notifications } = props;

  return (
    <div>
      {notifications.map((notification, index) => {
        const { fromProfile } = notification.extra;

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
                  </div>
                  <div className="mt-[8px] dark:text-white dark:text-opacity-80 text-neutral-500 text-12">
                    关注了你
                  </div>
                  <div className="pt-3 mt-[2px] text-12 flex items-center dark:text-white dark:text-opacity-80 text-gray-af leading-none">
                    <div className="mr-6 opacity-90">
                      {ago(notification.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
              {showLastReadFlag && (
                <div className="w-full text-12 text-center pt-10 dark:text-white dark:text-opacity-80 text-gray-400">
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

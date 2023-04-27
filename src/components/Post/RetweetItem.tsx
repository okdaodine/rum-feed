import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { IPost } from 'apis/types';
import Avatar from 'components/Avatar';
import { isMobile, isPc } from 'utils/env';
import ago from 'utils/ago';
import Fade from '@material-ui/core/Fade';
import replaceContent from 'utils/replaceContent';
import { useHistory } from 'react-router-dom';
import BFSReplace from 'utils/BFSReplace';
import Query from 'utils/query';
import escapeStringRegexp from 'escape-string-regexp';
import UserName from 'components/UserName';
import { Images } from './Item'

import './index.css';

interface IProps {
  post: IPost
  small?: boolean
  disabledClick?: boolean
}

export default observer((props: IProps) => {
  const { post } = props;
  const postBoxRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const profile = post.extra!.userProfile;
  const history = useHistory();
  const fromTwitter = (post.title || '').startsWith('https://twitter.com');
  const fromWeibo = (post.title || '').startsWith('https://weibo.com');
  const isTweet = fromTwitter || fromWeibo;
  const isIndexedBy = (post.title || '').includes('indexed by');
  const postContent = post.content.trim();

  React.useEffect(() => {
    setTimeout(() => {
      if (!Query.get('q')) {
        return; 
      }
      const box = contentRef.current;
      if (box) {
        BFSReplace(
          box,
          new RegExp(escapeStringRegexp(Query.get('q')), 'ig'),
          (text: string) => {
            const span = document.createElement('span');
            span.textContent = text;
            span.className = 'text-amber-500 font-bold';
            span.id = 'marker';
            return span;
          },
        );
      }
    }, 10);
  }, []);

  return (
    <Fade in={true} timeout={350}>          
      <div
        className={classNames({
          small: props.small
        }, 'bg-white dark:bg-transparent p-[10px] px-[14px] md:p-3 md:px-4 rounded-12 my-[6px] relative border dark:border-white dark:border-opacity-10 border-gray-d8/80 border-opacity-80')}
        ref={postBoxRef}
      >
        <div className="flex items-center">
          <Avatar
            className="mr-2"
            url={profile.avatar}
            size={20}
          />
          <div className="dark:text-white dark:text-opacity-80 text-gray-4a md:text-15">
            <UserName
              name={profile.name}
              normalNameClass="font-bold max-w-[40vw] md:max-w-[250px] truncate opacity-90 mt-[-4px] h-[18px] md:h-[20px]"
              fromClass='mt-[-2px] h-[15px] md:h-[17px]'
              fromNameClass="opacity-80 truncate font-bold max-w-[160px] md:max-w-[250px]"
              fromIconClass="text-22 mx-1"
              fromIdClass="opacity-50 truncate text-13 md:text-14 max-w-[60px] hidden md:block md:max-w-[140px]"
              />
          </div>
          <div
            className={classNames({
              'mt-[-2px]': isTweet && !isIndexedBy
            }, "flex items-center text-gray-88 opacity-70 dark:text-white dark:opacity-40 text-12 tracking-wide cursor-pointer")}
            onClick={() => {
              if (isMobile) {
                history.push(`/posts/${post.id}`);
              }
            }}
          >
            {(isPc || !isTweet || isIndexedBy) && (
              <span className="mx-[6px] transform scale-150 opacity-50">·</span>
            )}
            {ago(post.timestamp, {
              trimmed: true
            })}
          </div>
        </div>
        <div className="flex items-start pt-[6px]">
          {postContent && (post.images || []).length > 0 && (
            <div className={classNames({
              "w-[82px] h-[82px]": !props.small,
              "w-[40px] h-[40px]": props.small,
            }, "rounded-12 bg-cover bg-center mr-3 mt-[2px]")} style={{ backgroundImage: `url(${(post.images || [])[0]})` }} />
          )}
          {!postContent && (post.images || []).length > 0 && (
            <div className="pt-1">
              <Images images={post.images || []} />
            </div>
          )}
          {postContent && (
            <div className="relative flex-1">
              {(post.images || []).length > 0 && (
                <div className="pt-[2px]" />
              )}
              <div
                ref={contentRef}
                key={postContent}
                className={classNames(
                  {
                    'line-clamp-4': !props.small,
                    'line-clamp-2': props.small,
                    'text-[14px]': true
                  },
                  'dark:text-white dark:text-opacity-80 text-gray-4a break-all whitespace-pre-wrap tracking-wide',
                )}
                dangerouslySetInnerHTML={{
                  __html: replaceContent(`${postContent}`, {
                    disabled: isMobile
                  }),
                }}
                onClick={() => {
                  if (isMobile) {
                    history.push(`/posts/${post.id}`);
                  }
                }}
              />
            </div>
          )}
        </div>
        <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => {
          if (props.disabledClick) {
            return;
          }
          history.push(`/posts/${post.id}`);
        }} />
      </div>
    </Fade>
  );
});

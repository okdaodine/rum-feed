import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view-if-needed';
import { BsFillCaretDownFill, BsFillCaretUpFill } from 'react-icons/bs';
import { IPost } from 'apis/types';
import ItemBottom from './ItemBottom';
import openPhotoSwipe from 'components/openPhotoSwipe';
import Avatar from 'components/Avatar';
import UserCard from 'components/UserCard';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';
import { isMobile, isPc } from 'utils/env';
import ago from 'utils/ago';
import Fade from '@material-ui/core/Fade';
import replaceContent from 'utils/replaceContent';
import { useHistory } from 'react-router-dom';
import BFSReplace from 'utils/BFSReplace';
import Query from 'utils/query';
import escapeStringRegexp from 'escape-string-regexp';
import UserName from 'components/UserName';
import { useStore } from 'store';
import LinkCard from 'components/LinkCard';
import extractUrls from 'utils/extractUrls';
import RetweetItem from './RetweetItem';
import MutedContent from 'components/MutedContent';
import Video from 'components/Video';
import DOMPurify from 'dompurify';
import Quote from './Quote';

import './index.css';
import isRetweetUrl from 'utils/isRetweetUrl';

interface IProps {
  post: IPost
  where: 'postList' | 'postDetail' | 'postDetailModal'
  inModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  hideBottom?: boolean
}

export const Images = observer((props: { images: string[] }) => {
  const count = props.images.length;

  return (
    <div className={classNames({
      count_1: count === 1,
      'grid grid-cols-2 gap-1': count === 2,
      'grid grid-cols-3 gap-1': count === 3,
      'grid grid-rows-2 grid-cols-2 gap-1': count === 4,
    }, 'rounded-12 overflow-hidden max-w-[70vw] md:max-w-[100%]')}
    >
      {props.images.map((image: string, index) => {
        const url = image;
        const onClick = () => {
          openPhotoSwipe({
            image: props.images,
            index,
          });
        };
        const divRef = React.useRef(null);
        return (
          <div key={index}>
            {count === 1 && (
              <div
                className="rounded-12"
                ref={divRef}
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img
                  className="cursor-pointer opacity-0 absolute top-[-9999px] left-[-9999px]"
                  src={url}
                  alt={`${index}`}
                  onLoad={(e: any) => {
                    const div: any = divRef.current;
                    const { width, height } = e.target;
                    let _height = height;
                    let _width = width;
                    const MAX_WIDTH = isMobile ? window.innerWidth * 2/3 : 350;
                    const MAX_HEIGHT = isMobile ? window.innerWidth * 2/3 : 350;
                    if (width > MAX_WIDTH) {
                      _width = MAX_WIDTH;
                      _height = Math.round((_width * height) / width);
                    }
                    if (_height > MAX_HEIGHT) {
                      _height = MAX_HEIGHT;
                      _width = Math.round((_height * width) / height);
                    }
                    _width = Math.max(_width, 100);
                    div.style.width = `${_width}px`;
                    div.style.height = `${_height}px`;
                    e.target.style.position = 'static';
                    e.target.style.top = 0;
                    e.target.style.left = 0;
                    e.target.style.width = '100%';
                    e.target.style.height = '100%';
                  }}

                />
              </div>
            )}
            {count === 2 && (
              <div
                className="h-[35vw] md:h-45 overflow-hidden"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img className="w-full h-full opacity-0" src={url} alt="" />
              </div>
            )}
            {count === 3 && (
              <div
                className="h-[45vw] md:h-50 overflow-hidden"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img className="w-full h-full opacity-0" src={url} alt="" />
              </div>
            )}
            {count === 4 && (
              <div
                className="h-[32vw] md:h-34 overflow-hidden"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img className="w-full h-full opacity-0" src={url} alt="" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default observer((props: IProps) => {
  const { groupStore, relationStore, confirmDialogStore } = useStore();
  const { post } = props;
  const inPostDetail = props.where.startsWith('postDetail');
  const state = useLocalObservable(() => ({
    canExpandContent: false,
    expandContent: inPostDetail || false,
  }));
  const postBoxRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const profile = post.extra!.userProfile;
  const history = useHistory();
  const fromTwitter = (post.title || '').startsWith('https://twitter.com');
  const fromWeibo = (post.title || '').startsWith('https://weibo.com');
  const isTweet = fromTwitter || fromWeibo;
  const isIndexedBy = (post.title || '').includes('indexed by');

  const lastUrl = React.useMemo(() => {
    const urls = extractUrls(post.content || '');
    if (urls.length > 0) {
      return urls.pop();
    }
    return '';
  }, [post.content]);

  const postContent = React.useMemo(() => {
    let postContent = post.content.trim();
    if (lastUrl) {
      if (
        !postContent.endsWith(lastUrl) ||
        (isRetweetUrl(lastUrl) && !post.extra?.retweet) ||
        (post.extra?.retweet && !(new URL(lastUrl).pathname.includes(post.extra?.retweet!.id))) ||
        lastUrl.includes('commentId')
      ) {
        return postContent;
      }
      postContent = postContent.slice(0, -lastUrl.length);
    }
    return postContent;
  }, [post.content, lastUrl]);

  React.useEffect(() => {
    if (inPostDetail || !post.content) {
      return;
    }
    if (
      contentRef.current
      && contentRef.current.scrollHeight > contentRef.current.clientHeight
    ) {
      state.canExpandContent = true;
    } else {
      state.canExpandContent = false;
    }
  }, [post.content]);

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

  React.useEffect(() => {
    (async () => {
      await sleep(500);
      if (relationStore.mutedMe.has(post.userAddress)) {
        confirmDialogStore.show({
          content: lang.contentFromMutedMeDialogMessage(post.extra.userProfile.name),
          cancelDisabled: true,
          okText: lang.gotIt,
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(400);
            history.push('/');
          },
        });
      }
    })();
  }, []);

  if (relationStore.mutedMe.has(post.userAddress)) {
    return null;
  }

  return (
    <Fade in={true} timeout={350}>
      <MutedContent address={post.userAddress} className="dark:text-white dark:text-opacity-80 text-gray-4a opacity-60 my-8 md:my-3 py-4 md:py-[10px] px-4 mx-5 md:mx-0 rounded-12 flex justify-center border dark:border-white dark:border-opacity-10 border-gray-d8/80 border-opacity-80 md:border-none">
        <div
          className={classNames({
            'border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-ec border-opacity-80': (isMobile && !inPostDetail) || (isPc && props.withBorder),
            'pt-6 pb-3': inPostDetail,
            'pt-[18px] pb-2': !inPostDetail
          }, 'post-item bg-white dark:bg-transparent pl-4 pr-2 md:pl-8 md:pr-6 w-full lg:w-full md:w-[600px] relative')}
          ref={postBoxRef}
        >
          <div className="relative">
            <UserCard
              disableHover={props.disabledUserCardTooltip}
              userAddress={post.userAddress}
            >
              <Avatar
                className="absolute top-[-4px] left-[-4px]"
                url={profile.avatar}
                size={44}
              />
            </UserCard>
            <div className="pl-12 ml-1">
              <div className="pt-[1px] flex items-center">
                <UserCard
                  disableHover={props.disabledUserCardTooltip}
                  userAddress={post.userAddress}
                >
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
                </UserCard>
                <div
                  className={classNames({
                    'mt-[-2px]': isTweet && !isIndexedBy
                  }, "flex items-center text-gray-88 opacity-70 dark:text-white dark:opacity-40 text-12 tracking-wide cursor-pointer")}
                  onClick={() => {
                    if (isMobile || !inPostDetail) {
                      history.push(`/posts/${post.id}`);
                    }
                  }}
                >
                  {(isPc || !isTweet || isIndexedBy) && (
                    <span className="mx-[6px] transform scale-150 opacity-50">·</span>
                  )}
                  {ago(post.timestamp, {
                    trimmed: !inPostDetail
                  })}
                </div>
              </div>
              {postContent && (
                <div className="pb-1 relative">
                  <div
                    ref={contentRef}
                    key={postContent}
                    className={classNames(
                      {
                        expandContent: state.expandContent,
                        fold: !state.expandContent,
                        'text-[15px]': inPostDetail,
                        'text-[14px]': !inPostDetail,
                      },
                      'mt-[4px] dark:text-white dark:text-opacity-80 text-gray-4a break-words whitespace-pre-wrap tracking-wide pr-2 md:pr-0',
                    )}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(replaceContent(`${postContent}`, {
                        disabled: isMobile && !inPostDetail
                      }) +`${isTweet && isMobile && inPostDetail ? ` <a class="text-sky-400 text-12" href="${(post.title || '').split(' ')[0]}"}>查看原文</a>` : ''}`)
                    }}
                    onClick={() => {
                      if (isMobile) {
                        history.push(`/posts/${post.id}`);
                      }
                    }}
                  />
                  {!state.expandContent && state.canExpandContent && (
                    <div className="relative mt-6-px pb-4">
                      <div
                        className="text-sky-500 cursor-pointer tracking-wide flex items-center text-12 absolute w-full top-1 left-0 mt-[-6px]"
                        onClick={() => { state.expandContent = true; }}
                      >
                        {lang.expand}
                        <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
                      </div>
                    </div>
                  )}
                  {state.expandContent && state.canExpandContent && (
                    <div className="relative mt-6-px pb-4">
                      <div
                        className="text-sky-500 cursor-pointer tracking-wide flex items-center text-12 absolute w-full top-1 left-0 mt-[-6px]"
                        onClick={async () => {
                          state.expandContent = false;
                          await sleep(1);
                          scrollIntoView(postBoxRef.current!, { scrollMode: 'if-needed' });
                        }}
                      >
                        {lang.shrink}
                        <BsFillCaretUpFill className="text-12 ml-[1px] opacity-70" />
                      </div>
                    </div>
                  )}
                  {isPc && state.expandContent && state.canExpandContent && postContent.length > 600 && (
                    <div
                      className="text-sky-500 cursor-pointer tracking-wide flex items-center text-12 absolute top-[2px] right-[-90px] opacity-80"
                      onClick={() => {
                        state.expandContent = false;
                      }}
                    >
                      {lang.shrink}
                      <BsFillCaretUpFill className="text-12 ml-[1px] opacity-70" />
                    </div>
                  )}
                </div>
              )}
              {(post.images || []).length > 0 && <div className={classNames({ 'pt-3': !postContent }, "pb-2")}>
                <Images images={post.images || []} />
              </div>}
              {post.video && (
                <div className={classNames({ 'pt-3': !postContent }, "pb-2 mr-4")}>
                  <Video 
                    poster={post.video.poster}
                    url={post.video.url}
                    width={post.video.width}
                    height={post.video.height}
                    duration={post.video.duration}
                  />
                </div>
              )}
              {post.extra!.retweet && (
                <div className="mr-2 md:mr-0">
                  <RetweetItem post={post.extra!.retweet} />
                </div>
              )}
              {lastUrl && !post.extra!.retweet && (
                <div className={classNames({
                  'pt-2': !postContent && !post.images && !post.video
                }, "mr-2 md:mr-0 pb-2")}>
                  <LinkCard url={lastUrl} />
                </div>
              )}
              {post.quote && (
                <div className="mb-2 mt-[2px] mr-2">
                  <Quote quote={post.quote} />
                </div>
              )}
              {groupStore.multiple && (
                <div className="flex pt-2 pb-2 tracking-wider">
                  <div className="bg-[#EFF3F4] bg-opacity-100 dark:bg-opacity-10 text-12 py-[2px] px-2 flex items-center rounded-full cursor-pointer" onClick={() => {
                    history.push(`/groups/${post.groupId}`)
                  }}>
                    <div className="w-[10px] h-[10px] bg-[#37434D] rounded-full mr-[6px] opacity-30 dark:bg-white dark:opacity-30" />
                    <span className="text-[#37434D] opacity-[0.55] font-bold dark:text-white dark:opacity-50">{post.extra.groupName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ItemBottom
            post={post}
            where={props.where}
            hideBottom={props.hideBottom}
          />
        </div>
      </MutedContent>
    </Fade>
  );
});

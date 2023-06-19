import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { RedirectApi } from 'apis'
import * as BVideoUtils from './utils';
import DOMPurify from 'dompurify';
import { isMobile } from 'utils/env';
import { runInAction } from 'mobx';
import { lang } from 'utils/lang';

export default observer((props: { url: string }) => {
  const isShortBVideo = BVideoUtils.isShortUrl(props.url);
  const state = useLocalObservable(() => ({
    url: isShortBVideo ? '' : props.url,
    fetched: !isShortBVideo,
  }));
  const width = isMobile ? 290 : 460;
  const height = isMobile ? 163 : 258;

  React.useEffect(() => {
    if (!isShortBVideo) {
      return;
    }
    (async () => {
      state.fetched = false;
      state.url = '';
      try {
        const { redirectUrl } = await RedirectApi.get(props.url);
        if (!redirectUrl) {
          runInAction(() => {
            state.fetched = true;
          });
          return;
        }
        runInAction(() => {
          state.url = redirectUrl;
          state.fetched = true;
        });
      } catch (err) {
        console.log(err);
        state.fetched = true;
      }
    })();
  }, [props.url]);

  if (!state.fetched || !state.url) {
    return (
      <div className="rounded-12 bg-gray-400/10 flex items-center justify-center text-white/80" style={{
        width,
        height,
      }}>
        {state.fetched ? lang.videoCannotBePlayed : ''}
      </div>
    )
  }

  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <iframe
          class="rounded-12 overflow-hidden"
          scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"
          src="${`//www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${DOMPurify.sanitize(BVideoUtils.getId(state.url))}&danmaku=0`}"
          width="${width}"
          height="${height}"
        />
      `
    }}/>
  )
})

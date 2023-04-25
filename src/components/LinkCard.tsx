import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { LinkApi } from 'apis';
import { ILink } from 'apis/types';
import { AiOutlineLink } from 'react-icons/ai';
import Fade from '@material-ui/core/Fade';

export default observer((props: { url: string }) => {
  const state = useLocalObservable(() => ({
    loading: false,
    link: null as ILink | null,
  }));
  const isInternalUrl = props.url && new URL(props.url).pathname.startsWith('/posts/');

  React.useEffect(() => {
    if (isInternalUrl || !props.url || state.loading) {
      return;
    }
    (async () => {
      state.loading = true;
      state.link = null;
      try {
        state.link = await LinkApi.get(props.url);
      } catch (err) {
        console.log(err);
        state.link = null;
      }
      state.loading = false;
    })();
  }, [props.url]);

  if (isInternalUrl) {
    return null;
  }

  return (
    <Fade in={true} timeout={350}>
      <div className="py-2">
        <div className="relative">
          <div className="flex items-center dark:text-white dark:text-opacity-80 text-gray-6f rounded-12 overflow-hidden border dark:border-white dark:border-opacity-10 border-gray-d8/70 leading-none">
            {state.loading && (
              <div className="w-[80px] h-[80px] bg-gray-400/10 flex-shrink-0" />
            )}
            {!state.loading && state.link && state.link.image && (
              <div className="w-[80px] h-[80px] rounded-l-12 bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(data:image/jpeg;base64,${state.link.image})` }} />
            )}
            {!state.loading && (!state.link || !state.link.image) && (
              <div className="w-[80px] h-[80px] text-[28px] flex items-center justify-center bg-gray-400/10 flex-shrink-0">
                <AiOutlineLink />
              </div>
            )}
            {!state.loading && (
              <div className="px-3 md:px-4 flex-1 leading-5">
                {state.link && <div className='mt-[-2px] text-12 dark:opacity-60 opacity-80 tracking-wider line-clamp-1 break-all'>{new URL(props.url).origin}</div>}
                {state.link && <div className="mt-[1px] line-clamp-2 break-all">{state.link.title}</div>}
                {!state.link && <div className='text-14 dark:opacity-60 opacity-80 line-clamp-2 break-all'>{props.url}</div>}
              </div>
            )}
          </div>
          <a href={props.url} className="absolute inset-0 z-1"> </a>
        </div>
      </div>
    </Fade>
  )
})
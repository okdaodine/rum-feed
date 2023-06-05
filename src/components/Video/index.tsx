import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Plyr from "./Plyr";
import { IoMdClose } from 'react-icons/io';
import sleep from 'utils/sleep';
import classNames from 'classnames';

interface IProps {
  url: string
  poster: string
  width: number
  height: number
  duration: string
}

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    start: false,
    hasError: false,
    isFullscreen: false,
  }));
  
  const getPlyr = React.useCallback(async (plyr: Plyr) => {
    plyr.on('enterfullscreen', async () => {
      state.isFullscreen = true;
    });
    plyr.on('exitfullscreen', async () => {
      state.isFullscreen = false;
    });
  }, []);

  return (
    <div className={classNames({
      'plyr-container': !state.isFullscreen
    }, 'relative')}
    onClick={async () => {
      await sleep(100);
      if (document.querySelector('.plyr__control--pressed')) {
        state.start = true;
      }
    }}>
      <Plyr
        src={props.url}
        poster={props.poster}
        width={props.width}
        height={props.height}
        getPlyr={getPlyr}
      />
      <div className={`${state.start ? 'hidden' : ''} absolute bottom-2 right-6 py-1 px-2 text-13 bg-black/70 text-white/80 tracking-wide rounded-12 leading-none`}>
        {props.duration}
      </div>
      {state.hasError && (
        <div className="absolute inset-0 z-20 bg-gray-600 text-white/80 flex items-center justify-center rounded-12">
          <div className="flex items-center">
            <IoMdClose className="text-20 mr-1" />
            视频无法播放
          </div>
        </div>
      )}
    </div>
  )
});

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import VideoJS from 'components/VideoJS';
import { isMobile } from 'utils/env';
import Player from 'video.js/dist/types/player';
import sleep from 'utils/sleep';
import { IoMdClose } from 'react-icons/io';

export interface IVideoProps {
  poster: string
  url: string
  width: number
  height: number
  duration: string
}

export default observer((props: IVideoProps) => {
  const state = useLocalObservable(() => ({
    start: false,
    hasError: false,
  }));
  const options = React.useMemo(() => {
    const options: any = {
      autoplay: false,
      controls: true,
      responsive: true,
      inactivityTimeout: 1500,
      poster: props.poster,
      playsinline: true,
      sources: [{
        src: props.url,
        type: 'video/mp4'
      }],
    };
    if (props.width >= props.height) {
      options.fluid = true;
    } else {
      options.width = isMobile ? 280 : 460;
      options.height = options.width;
    }
    return options;
  }, []);
  const playerRef = React.useRef(null as null | Player);

  const onReady = async (player: Player) => {
    playerRef.current = player;
    (window as any).player = player;
    player.on('click', () => {
      state.start = true;
    });
    player.on('touchstart', () => {
      state.start = true;
    });
    player.on('mouseleave', async () => {
      await sleep(100);
      player.userActive(false);
      await sleep(500);
      player.userActive(false);
    });
    player.on('playing', async () => {
      if (isMobile) {
        await sleep(200);
        player.userActive(false);
      }
    });
    let errorCount = 0;
    player.on('error', () => {
      errorCount++;
      if (errorCount === options.sources.length) {
        state.hasError = true;
      }
    });
  }

  return (
    <div className="md:max-w-[460px] relative">
      <VideoJS options={options} onReady={onReady} />
      <div className={`${state.start ? 'hidden' : ''} absolute bottom-3 left-3 py-1 px-2 text-13 bg-black/70 text-white/80 tracking-wide rounded-12 leading-none`}>
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
})
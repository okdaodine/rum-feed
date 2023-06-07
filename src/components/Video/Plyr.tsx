import React from 'react';
import { observer } from 'mobx-react-lite';
import Plyr from "plyr-react";
import sleep from 'utils/sleep';

import "plyr-react/plyr.css"
import './index.css';

interface IProps {
  src: string
  poster: string
  width: number
  height: number
  getPlyr: (plyr: Plyr) => void
}

export default observer((props: IProps) => {
  const ref = React.useRef(null as any);

  React.useEffect(() => {
    (async () => {
      await sleep(200);
      if (ref.current) {
        const { plyr } = ref.current;
        plyr.on('ended', async () => {
          plyr.toggleControls(false);
        });
        props.getPlyr(plyr);
      }
    })();
  }, []);

  return (
    <Plyr
      ref={ref}
      loop
      preload='auto'
      playsInline
      source={{
        type: 'video',
        sources: [{
          src: props.src,
          type: 'video/mp4',
        }],
        poster: props.poster,
      }}
      options={{
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'fullscreen',
        ],
        iconUrl: 'https://storage.googleapis.com/static.press.one/feed/plyr.svg',
        fullscreen: { enabled: true, fallback: true, iosNative: true }
        // invertTime: false,
        // displayDuration: true,
      }}
    />
  )
});

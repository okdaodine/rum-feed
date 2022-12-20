import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { FeedType } from 'store/post';
import Fade from '@material-ui/core/Fade';

interface ITab {
  text: string
  value: FeedType
}

const tabs: ITab[] = [{
  text: '最新',
  value: 'latest'
}, {
  text: '关注',
  value: 'following'
}, {
  text: '发现',
  value: 'random'
}];

export default observer(() => {
  const { postStore } = useStore();

  return (
    <div className="flex items-stretch text-center pl-2 md:pl-0">
      {tabs.map(tab => {
        const active = postStore.feedType === tab.value;
        return (
          <div
            key={tab.value}
            className="py-[10px] md:py-[11px] px-4 relative cursor-pointer"
            onClick={() => {
              postStore.setFeedType(tab.value);
            }}>
            <span className={active ? 'dark:text-white dark:text-opacity-80 text-black font-bold' : 'dark:text-white dark:text-opacity-80 text-neutral-400'}>{tab.text}</span>
            {active && (
              <Fade in={true} timeout={500}>
                <div className="flex justify-center absolute bottom-0 left-0 w-full">
                  <div className="w-10 dark:bg-white bg-black h-[3px] rounded-full" />
                </div>
              </Fade>
            )}
          </div>
        )
      })}
    </div>
  )
})
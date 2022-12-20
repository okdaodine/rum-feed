import { AiOutlineTwitter, AiOutlineWeibo } from 'react-icons/ai';
import Tooltip from '@material-ui/core/Tooltip';

interface IProps {
  name: string
  normalNameClass?: string
  fromClass?: string
  fromNameClass?: string
  fromIconClass?: string
  fromIdClass?: string
}

export default (props: IProps) => {
  const name = props.name || '';
  const isTweet = name.includes('\n@');
  const fromWeibo = isTweet && name.includes('\n@weibo');
  const fromTwitter = isTweet && !fromWeibo;
  if (!isTweet) {
    return (
      <div className={props.normalNameClass}>
        {name}
      </div>
    )
  }

  if (fromTwitter) {
    return (
      <div className={`flex items-center ${props.fromClass}`}>
        <span className={props.fromNameClass}>{name.split('\n@')[0]}</span>
        <Tooltip
          enterDelay={200}
          enterNextDelay={200}
          placement="top"
          title='本号所有内容来自同名推特'
          arrow
          >
          <div className="mt-[-1px]">
            <AiOutlineTwitter className={props.fromIconClass + ' text-sky-500'} />
          </div>
        </Tooltip>
        <span className={props.fromIdClass}>@{name.split('\n@')[1]}</span>
      </div>
    )
  }

  if (fromWeibo) {
    return (
      <div className={`flex items-center ${props.fromClass}`}>
        <span className={props.fromNameClass}>{name.split('\n@')[0]}</span>
        <Tooltip
          enterDelay={200}
          enterNextDelay={200}
          placement="top"
          title='本号所有内容来自同名微博'
          arrow
          >
          <div className="mt-[-2px]">
            <AiOutlineWeibo className={props.fromIconClass + ' text-rose-400 opacity-80'} />
          </div>
        </Tooltip>
      </div>
    )
  }

  return null;
}
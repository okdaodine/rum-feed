import React from 'react';

interface IProps {
  scrollRef?: React.RefObject<HTMLElement>
  threshold?: number
  callback?: (yes: boolean) => void
}

export default (props: IProps) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  React.useEffect(() => {
    const scrollElement: any = props.scrollRef?.current;
    if (!scrollElement) {
      return;
    }
    const callback = () => {
      if (props && props.callback && props.threshold) {
        props.callback(scrollElement.scrollTop >= props.threshold);
      }
      setScrollTop(scrollElement.scrollTop);
    };
    setScrollTop(scrollElement.scrollTop);
    scrollElement.addEventListener('scroll', callback);

    return () => {
      scrollElement.removeEventListener('scroll', callback);
    };
  }, [props.scrollRef?.current]);

  return scrollTop;
};

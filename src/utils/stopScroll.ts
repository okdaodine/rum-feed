import { isWeChat } from 'utils/env';

let stoppedScroll = false;
let scrollTop = 0;
export default (element: any, isFixed: boolean, options: any = {}) => {
  if (isWeChat) {
    return;
  }
  const { disabled } = options;
  if (disabled) {
    element.style.position = 'static';
    return;
  }
  if (isFixed === stoppedScroll) {
    return;
  }
  if (isFixed) {
    if (stoppedScroll) {
      return;
    }
    scrollTop = window.scrollY;
    element.style.position = 'fixed';
    if (scrollTop > 0) {
      element.style.top = -scrollTop + 'px';
    }
  } else {
    element.style.position = 'static';
    element.style.top = '';
    window.scrollTo(0, scrollTop);
  }
  stoppedScroll = isFixed;
};
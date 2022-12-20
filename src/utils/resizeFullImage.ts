import { isMobile } from 'utils/env';

export default (url: any) => {
  if (!url) {
    return url;
  }
  if (isMobile) {
    return `${url}?image=&action=resize:w_${window.innerWidth * window.devicePixelRatio}`;
  }
  return `${url}?image=&action=resize:w_${700 * window.devicePixelRatio}`;
}
import urlify from 'utils/urlify';
import hashtag from 'utils/hashtag';

export default (text: string, options?: { disabled: boolean }) => {
  return hashtag(urlify(text, options), options);
};

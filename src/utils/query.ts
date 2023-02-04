import qs from 'query-string';

export default {
  get (name: string) {
    if (typeof window === 'undefined') {
      return '';
    }
    return String(qs.parse(window.location.search)[name] || '');
  },
  
  set(param: any = {}) {
    if (typeof window === 'undefined') {
      return '';
    }
    let parsed = qs.parse(window.location.search);
    parsed = {
      ...parsed,
      ...param,
    };
    if (window.history.replaceState) {
      const newUrl =
        window.location.protocol +
        '//' +
        window.location.host +
        window.location.pathname +
        `?${decodeURIComponent(qs.stringify(parsed))}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  },
  
  remove (name: string) {
    if (typeof window === 'undefined') {
      return '';
    }
    let parsed = qs.parse(window.location.search);
    delete parsed[name];
    const isEmpty = Object.keys(parsed).length === 0;
    if (window.history.replaceState) {
      const newUrl =
        window.location.protocol +
        '//' +
        window.location.host +
        window.location.pathname +
        `${isEmpty ? '' : '?' + decodeURIComponent(qs.stringify(parsed))}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }
}
export const isUrl = (url: string) => (isRawUrl(url) && !!getId(url)) || isShortUrl(url);

export const isRawUrl = (url: string) => !!url.includes('bilibili.com');

export const isShortUrl = (url: string) => !!url.includes('b23.tv');

export const getId = (url: string) => (url || '').match(/(\/video\/)(\w*)/)?.[0]?.split('/').pop() as string || '';
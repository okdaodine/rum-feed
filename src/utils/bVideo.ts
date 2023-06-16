export const isUrl = (url: string) => !!url.includes('bilibili.com') && !!getId(url);

export const getId = (url: string) => url.match(/(\/video\/)(\w*)/)?.[0]?.split('/').pop() as string || '';
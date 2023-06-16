export const isUrl = (url: string) => !!url.includes('bilibili.com') && !!getId(url);

export const getId = (url: string) => (new URL(url).pathname as any).match(/(?<=\/video\/)(\w*)/)?.[0]
import sleep from 'utils/sleep';
import { API_BASE_URL } from 'apis/common';
import store from 'store2';

const BASE = '';
export default async (url: any, options: any = {}) => {
  const hasEffectMethod = ['post', 'delete', 'put'].includes((options.method || '').toLocaleLowerCase());
  if (url.startsWith(API_BASE_URL)) {
    options.headers = {
      'X-Address': (window as any).store.userStore.address || ''
    }
  }
  if (hasEffectMethod) {
    options.headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
    };
    options.body = JSON.stringify(options.body);
  }
  if (options.jwt) {
    options.headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${options.jwt}`,
    }
  }

  if (!options.base) {
    options.credentials = 'include';
  }
  const result = await Promise.all([
    fetch(new Request((options.base || BASE) + url), options),
    sleep(options.minPendingDuration ? options.minPendingDuration : 0)
  ]);
  const res: any = result[0];
  let resData;
  if (options.isTextResponse) {
    resData = await res.text();
  } else {
    resData = await res.json();
  }
  if (res.ok) {
    return resData;
  } else {
    if (hasEffectMethod && res.status === 401) {
      store.clear();
      window.location.href = `${window.location.pathname}?action=openLoginModal`;
      await sleep(5000);
    }
    throw Object.assign(new Error(), {
      code: resData.code,
      status: res.status,
      message: resData.message,
    });
  }
};

// @ts-nocheck

const { isEmpty } = require('lodash');

export const isProduction = process.env.REACT_APP_ENV === 'production';

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent,
) || window.innerWidth < 760;

export const isAndroid = /Android/i.test(navigator.userAgent);

export const isIPhone = isMobile && !isAndroid;

export const isPc = !isMobile;

export const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

export const isFirefox = navigator.userAgent.indexOf("Firefox") > 0;

export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const isMI = /; MI /i.test(navigator.userAgent);

export const getMixinContext = () => {
  let ctx: any = {};
  try {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.MixinContext) {
      ctx = JSON.parse(prompt('MixinContext.getContext()'))
      ctx.platform = ctx.platform || 'iOS'
    } else if (window.MixinContext && (typeof window.MixinContext.getContext === 'function')) {
      ctx = JSON.parse(window.MixinContext.getContext())
      ctx.platform = ctx.platform || 'Android'
    }
  } catch (err) {
    console.log(err);
  }
  return {
    isMixinImmersive: (isMobile && ctx.immersive) || false,
    isMixin: !isEmpty(ctx)
  }
}
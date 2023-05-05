import { action, observable } from 'mobx';

const STORAGE_KEY = 'I18N_LANGUAGE';

const allLang = ['en', 'cn', 'tw'] as const;

export type AllLanguages = typeof allLang[number];
type LangData<T> = Record<AllLanguages, { content: T }>;

const defaultLang = (() => {
  const language = navigator.language || '';
  if (['zh-TW', 'zh-HK'].includes(language)) {
    return 'tw';
  }
  if (language.startsWith('zh')) {
    return 'cn';
  }
  return 'en';
})() as AllLanguages;

const state = observable({
  lang: defaultLang,
});

const createLangLoader = <T>(langData: LangData<T>) => {
  const langState = new Proxy({}, {
    get(_target, prop, _receiver) {
      const data = langData[state.lang];
      if (!data) {
        throw new Error(`${state.lang} language resource for this component is not defined.`);
      }
      return data.content[prop as keyof T];
    },
  });

  return langState as T;
};

const switchLang = action((lang: AllLanguages) => {
  state.lang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
});

const init = action(() => {
  let value = (localStorage.getItem(STORAGE_KEY) || defaultLang) as AllLanguages;
  if (!allLang.includes(value)) {
    value = defaultLang;
  }
  state.lang = value;
});

init();

export const i18n = {
  state,
  createLangLoader,
  switchLang,
};


(window as any).i18n = i18n;